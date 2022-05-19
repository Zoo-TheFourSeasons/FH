/* Copyright (C) 2007-2021 Open Information Security Foundation
 *
 * You can copy, redistribute or modify this Program under the terms of
 * the GNU General Public License version 2 as published by the Free
 * Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * version 2 along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
 * 02110-1301, USA.
 */

/**
 * \file
 *
 * \author Victor Julien <victor@inliniac.net>
 *
 * Implements the dsize keyword
 */

#include "suricata-common.h"
#include "decode.h"

#include "detect.h"
#include "detect-parse.h"
#include "detect-engine-prefilter-common.h"

#include "flow-var.h"

#include "detect-content.h"
#include "detect-dsize.h"

#include "util-unittest.h"
#include "util-debug.h"
#include "util-byte.h"

#include "pkt-var.h"
#include "host.h"
#include "util-profiling.h"

/**
 *  dsize:[<>!]<0-65535>[<><0-65535>];
 */
#define PARSE_REGEX "^\\s*(<|>|!)?\\s*([0-9]{1,5})\\s*(?:(<>)\\s*([0-9]{1,5}))?\\s*$"
static DetectParseRegex parse_regex;

static int DetectDsizeMatch (DetectEngineThreadCtx *, Packet *,
        const Signature *, const SigMatchCtx *);
static int DetectDsizeSetup (DetectEngineCtx *, Signature *s, const char *str);
#ifdef UNITTESTS
static void DsizeRegisterTests(void);
#endif
static void DetectDsizeFree(DetectEngineCtx *, void *);

static int PrefilterSetupDsize(DetectEngineCtx *de_ctx, SigGroupHead *sgh);
static bool PrefilterDsizeIsPrefilterable(const Signature *s);

/**
 * \brief Registration function for dsize: keyword
 */
void DetectDsizeRegister (void)
{
    sigmatch_table[DETECT_DSIZE].name = "dsize";
    sigmatch_table[DETECT_DSIZE].desc = "match on the size of the packet payload";
    sigmatch_table[DETECT_DSIZE].url = "/rules/payload-keywords.html#dsize";
    sigmatch_table[DETECT_DSIZE].Match = DetectDsizeMatch;
    sigmatch_table[DETECT_DSIZE].Setup = DetectDsizeSetup;
    sigmatch_table[DETECT_DSIZE].Free  = DetectDsizeFree;
#ifdef UNITTESTS
    sigmatch_table[DETECT_DSIZE].RegisterTests = DsizeRegisterTests;
#endif
    sigmatch_table[DETECT_DSIZE].SupportsPrefilter = PrefilterDsizeIsPrefilterable;
    sigmatch_table[DETECT_DSIZE].SetupPrefilter = PrefilterSetupDsize;

    DetectSetupParseRegexes(PARSE_REGEX, &parse_regex);
}

static inline int
DsizeMatch(const uint16_t psize, const uint8_t mode,
            const uint16_t dsize, const uint16_t dsize2)
{
    if (mode == DETECTDSIZE_EQ && dsize == psize)
        return 1;
    else if (mode == DETECTDSIZE_LT && psize < dsize)
        return 1;
    else if (mode == DETECTDSIZE_GT && psize > dsize)
        return 1;
    else if (mode == DETECTDSIZE_RA && psize > dsize && psize < dsize2)
        return 1;
    else if (mode == DETECTDSIZE_NE && dsize != psize)
        return 1;

    return 0;
}

/**
 * \internal
 * \brief This function is used to match flags on a packet with those passed via dsize:
 *
 * \param t pointer to thread vars
 * \param det_ctx pointer to the pattern matcher thread
 * \param p pointer to the current packet
 * \param s pointer to the Signature
 * \param m pointer to the sigmatch
 *
 * \retval 0 no match
 * \retval 1 match
 */
static int DetectDsizeMatch (DetectEngineThreadCtx *det_ctx, Packet *p,
    const Signature *s, const SigMatchCtx *ctx)
{
    SCEnter();
    int ret = 0;

    if (PKT_IS_PSEUDOPKT(p)) {
        SCReturnInt(0);
    }

    const DetectDsizeData *dd = (const DetectDsizeData *)ctx;

    SCLogDebug("p->payload_len %"PRIu16"", p->payload_len);

    ret = DsizeMatch(p->payload_len, dd->mode, dd->dsize, dd->dsize2);

    SCReturnInt(ret);
}

/**
 * \internal
 * \brief This function is used to parse dsize options passed via dsize: keyword
 *
 * \param rawstr Pointer to the user provided dsize options
 *
 * \retval dd pointer to DetectDsizeData on success
 * \retval NULL on failure
 */
static DetectDsizeData *DetectDsizeParse (const char *rawstr)
{
    DetectDsizeData *dd = NULL;
    int ret = 0, res = 0;
    size_t pcre2len;
    char mode[2] = "";
    char value1[6] = "";
    char value2[6] = "";
    char range[3] = "";

    ret = DetectParsePcreExec(&parse_regex, rawstr, 0, 0);
    if (ret < 3 || ret > 5) {
        SCLogError(SC_ERR_PCRE_MATCH,"Parse error %s", rawstr);
        goto error;
    }

    pcre2len = sizeof(mode);
    res = SC_Pcre2SubstringCopy(parse_regex.match, 1, (PCRE2_UCHAR8 *)mode, &pcre2len);
    if (res < 0) {
        SCLogError(SC_ERR_PCRE_GET_SUBSTRING, "pcre2_substring_copy_bynumber failed with %d", res);
        goto error;
    }
    SCLogDebug("mode \"%s\"", mode);

    pcre2len = sizeof(value1);
    res = pcre2_substring_copy_bynumber(parse_regex.match, 2, (PCRE2_UCHAR8 *)value1, &pcre2len);
    if (res < 0) {
        SCLogError(SC_ERR_PCRE_GET_SUBSTRING, "pcre2_substring_copy_bynumber failed");
        goto error;
    }
    SCLogDebug("value1 \"%s\"", value1);

    if (ret > 3) {
        pcre2len = sizeof(range);
        res = pcre2_substring_copy_bynumber(parse_regex.match, 3, (PCRE2_UCHAR8 *)range, &pcre2len);
        if (res < 0) {
            SCLogError(SC_ERR_PCRE_GET_SUBSTRING, "pcre2_substring_copy_bynumber failed");
            goto error;
        }
        SCLogDebug("range \"%s\"", range);

        if (ret > 4) {
            pcre2len = sizeof(value2);
            res = pcre2_substring_copy_bynumber(
                    parse_regex.match, 4, (PCRE2_UCHAR8 *)value2, &pcre2len);
            if (res < 0) {
                SCLogError(SC_ERR_PCRE_GET_SUBSTRING, "pcre2_substring_copy_bynumber failed");
                goto error;
            }
            SCLogDebug("value2 \"%s\"", value2);
        }
    }

    dd = SCMalloc(sizeof(DetectDsizeData));
    if (unlikely(dd == NULL))
        goto error;
    dd->dsize = 0;
    dd->dsize2 = 0;
    dd->mode = 0;

    if (strcmp("<>", range) == 0) {
        if (strlen(mode) != 0) {
            SCLogError(SC_ERR_INVALID_ARGUMENT,"Range specified but mode also set");
            goto error;
        }
        dd->mode = DETECTDSIZE_RA;
    } else if (strlen(mode) > 0) {
        if (mode[0] == '<')
            dd->mode = DETECTDSIZE_LT;
        else if (mode[0] == '>')
            dd->mode = DETECTDSIZE_GT;
        else if (mode[0] == '!')
            dd->mode = DETECTDSIZE_NE;
        else
            dd->mode = DETECTDSIZE_EQ;
    } else {
        dd->mode = DETECTDSIZE_EQ; // default
    }

    /** set the first dsize value */
    if (StringParseUint16(&dd->dsize,10,strlen(value1),value1) <= 0) {
        SCLogError(SC_ERR_INVALID_ARGUMENT, "Invalid size value1:\"%s\"", value1);
        goto error;
    }

    /** set the second dsize value if specified */
    if (strlen(value2) > 0) {
        if (dd->mode != DETECTDSIZE_RA) {
            SCLogError(SC_ERR_INVALID_ARGUMENT,"Multiple dsize values specified but mode is not range");
            goto error;
        }

        if (StringParseUint16(&dd->dsize2,10,strlen(value2),value2) <= 0) {
            SCLogError(SC_ERR_INVALID_ARGUMENT,"Invalid size value2:\"%s\"",value2);
            goto error;
        }

        if (dd->dsize2 <= dd->dsize) {
            SCLogError(SC_ERR_INVALID_ARGUMENT,"dsize2:%"PRIu16" <= dsize:%"PRIu16"",dd->dsize2,dd->dsize);
            goto error;
        }
    }

    SCLogDebug("dsize parsed successfully dsize: %"PRIu16" dsize2: %"PRIu16"",dd->dsize,dd->dsize2);
    return dd;

error:
    if (dd)
        SCFree(dd);
    return NULL;
}

/**
 * \internal
 * \brief this function is used to add the parsed dsize into the current signature
 *
 * \param de_ctx pointer to the Detection Engine Context
 * \param s pointer to the Current Signature
 * \param rawstr pointer to the user provided flags options
 *
 * \retval 0 on Success
 * \retval -1 on Failure
 */
static int DetectDsizeSetup (DetectEngineCtx *de_ctx, Signature *s, const char *rawstr)
{
    DetectDsizeData *dd = NULL;
    SigMatch *sm = NULL;

    if (DetectGetLastSMFromLists(s, DETECT_DSIZE, -1)) {
        SCLogError(SC_ERR_INVALID_SIGNATURE, "Can't use 2 or more dsizes in "
                   "the same sig.  Invalidating signature.");
        goto error;
    }

    SCLogDebug("\'%s\'", rawstr);

    dd = DetectDsizeParse(rawstr);
    if (dd == NULL) {
        SCLogError(SC_ERR_INVALID_ARGUMENT,"Parsing \'%s\' failed", rawstr);
        goto error;
    }

    /* Okay so far so good, lets get this into a SigMatch
     * and put it in the Signature. */
    sm = SigMatchAlloc();
    if (sm == NULL){
        SCLogError(SC_ERR_MEM_ALLOC, "Failed to allocate memory for SigMatch");
        SCFree(dd);
        goto error;
    }

    sm->type = DETECT_DSIZE;
    sm->ctx = (SigMatchCtx *)dd;

    SigMatchAppendSMToList(s, sm, DETECT_SM_LIST_MATCH);

    SCLogDebug("dd->dsize %"PRIu16", dd->dsize2 %"PRIu16", dd->mode %"PRIu8"",
            dd->dsize, dd->dsize2, dd->mode);
    /* tell the sig it has a dsize to speed up engine init */
    s->flags |= SIG_FLAG_REQUIRE_PACKET;
    s->flags |= SIG_FLAG_DSIZE;

    if (s->init_data->dsize_sm == NULL) {
        s->init_data->dsize_sm = sm;
    }

    return 0;

error:
    return -1;
}

/**
 * \internal
 * \brief this function will free memory associated with DetectDsizeData
 *
 * \param de pointer to DetectDsizeData
 */
void DetectDsizeFree(DetectEngineCtx *de_ctx, void *de_ptr)
{
    DetectDsizeData *dd = (DetectDsizeData *)de_ptr;
    if(dd) SCFree(dd);
}

/* prefilter code */

static void
PrefilterPacketDsizeMatch(DetectEngineThreadCtx *det_ctx, Packet *p, const void *pectx)
{
    if (PKT_IS_PSEUDOPKT(p)) {
        SCReturn;
    }

    const PrefilterPacketHeaderCtx *ctx = pectx;
    if (!PrefilterPacketHeaderExtraMatch(ctx, p))
        return;

    const uint16_t dsize = p->payload_len;
    if (DsizeMatch(dsize, ctx->v1.u8[0], ctx->v1.u16[1], ctx->v1.u16[2]))
    {
        SCLogDebug("packet matches dsize %u", dsize);
        PrefilterAddSids(&det_ctx->pmq, ctx->sigs_array, ctx->sigs_cnt);
    }
}

static void
PrefilterPacketDsizeSet(PrefilterPacketHeaderValue *v, void *smctx)
{
    const DetectDsizeData *a = smctx;
    v->u8[0] = a->mode;
    v->u16[1] = a->dsize;
    v->u16[2] = a->dsize2;
}

static bool
PrefilterPacketDsizeCompare(PrefilterPacketHeaderValue v, void *smctx)
{
    const DetectDsizeData *a = smctx;
    if (v.u8[0] == a->mode &&
        v.u16[1] == a->dsize &&
        v.u16[2] == a->dsize2)
        return true;
    return false;
}

static int PrefilterSetupDsize(DetectEngineCtx *de_ctx, SigGroupHead *sgh)
{
    return PrefilterSetupPacketHeader(de_ctx, sgh, DETECT_DSIZE,
            PrefilterPacketDsizeSet,
            PrefilterPacketDsizeCompare,
            PrefilterPacketDsizeMatch);
}

static bool PrefilterDsizeIsPrefilterable(const Signature *s)
{
    const SigMatch *sm;
    for (sm = s->init_data->smlists[DETECT_SM_LIST_MATCH] ; sm != NULL; sm = sm->next) {
        switch (sm->type) {
            case DETECT_DSIZE:
                return true;
        }
    }
    return false;
}

/** \brief get max dsize "depth"
 *  \param s signature to get dsize value from
 *  \retval depth or negative value
 */
int SigParseGetMaxDsize(const Signature *s)
{
    if (s->flags & SIG_FLAG_DSIZE && s->init_data->dsize_sm != NULL) {
        const DetectDsizeData *dd = (const DetectDsizeData *)s->init_data->dsize_sm->ctx;

        switch (dd->mode) {
            case DETECTDSIZE_LT:
            case DETECTDSIZE_EQ:
            case DETECTDSIZE_NE:
                return dd->dsize;
            case DETECTDSIZE_RA:
                return dd->dsize2;
            case DETECTDSIZE_GT:
            default:
                SCReturnInt(-2);
        }
    }
    SCReturnInt(-1);
}

/** \brief set prefilter dsize pair
 *  \param s signature to get dsize value from
 */
void SigParseSetDsizePair(Signature *s)
{
    if (s->flags & SIG_FLAG_DSIZE && s->init_data->dsize_sm != NULL) {
        DetectDsizeData *dd = (DetectDsizeData *)s->init_data->dsize_sm->ctx;

        uint16_t low = 0;
        uint16_t high = 65535;

        switch (dd->mode) {
            case DETECTDSIZE_LT:
                low = 0;
                high = dd->dsize;
                break;
            case DETECTDSIZE_EQ:
            case DETECTDSIZE_NE:
                low = dd->dsize;
                high = dd->dsize;
                break;
            case DETECTDSIZE_RA:
                low = dd->dsize;
                high = dd->dsize2;
                break;
            case DETECTDSIZE_GT:
                low = dd->dsize;
                high = 65535;
                break;
        }
        s->dsize_mode = dd->mode;
        s->dsize_low = low;
        s->dsize_high = high;

        SCLogDebug("low %u, high %u, mode %u", low, high, dd->mode);
    }
}

/**
 *  \brief Apply dsize as depth to content matches in the rule
 *  \param s signature to get dsize value from
 */
void SigParseApplyDsizeToContent(Signature *s)
{
    SCEnter();

    if (s->flags & SIG_FLAG_DSIZE) {
        SigParseSetDsizePair(s);

        int dsize = SigParseGetMaxDsize(s);
        if (dsize < 0) {
            /* nothing to do */
            return;
        }

        SigMatch *sm = s->init_data->smlists[DETECT_SM_LIST_PMATCH];
        for ( ; sm != NULL;  sm = sm->next) {
            if (sm->type != DETECT_CONTENT) {
                continue;
            }

            DetectContentData *cd = (DetectContentData *)sm->ctx;
            if (cd == NULL) {
                continue;
            }

            if (cd->depth == 0 || cd->depth >= dsize) {
                cd->flags |= DETECT_CONTENT_DEPTH;
                cd->depth = (uint16_t)dsize;
                SCLogDebug("updated %u, content %u to have depth %u "
                        "because of dsize.", s->id, cd->id, cd->depth);
            }
        }
    }
}

/*
 * ONLY TESTS BELOW THIS COMMENT
 */

#ifdef UNITTESTS
#include "detect-engine.h"

/**
 * \test this is a test for a valid dsize value 1
 *
 */
static int DsizeTestParse01(void)
{
    DetectDsizeData *dd = DetectDsizeParse("1");
    FAIL_IF_NULL(dd);
    FAIL_IF_NOT(dd->dsize == 1);
    FAIL_IF_NOT(dd->dsize2 == 0);

    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test this is a test for a valid dsize value >10
 *
 */
static int DsizeTestParse02(void)
{
    DetectDsizeData *dd = DetectDsizeParse(">10");
    FAIL_IF_NULL(dd);
    FAIL_IF_NOT(dd->dsize == 10);
    FAIL_IF_NOT(dd->mode == DETECTDSIZE_GT);
    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test this is a test for a valid dsize value <100
 *
 */
static int DsizeTestParse03(void)
{
    DetectDsizeData *dd = DetectDsizeParse("<100");
    FAIL_IF_NULL(dd);
    FAIL_IF_NOT(dd->dsize == 100);
    FAIL_IF_NOT(dd->mode == DETECTDSIZE_LT);

    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test this is a test for a valid dsize value 1<>2
 *
 */
static int DsizeTestParse04(void)
{
    DetectDsizeData *dd = DetectDsizeParse("1<>2");
    FAIL_IF_NULL(dd);
    FAIL_IF_NOT(dd->dsize == 1);
    FAIL_IF_NOT(dd->dsize2 == 2);
    FAIL_IF_NOT(dd->mode == DETECTDSIZE_RA);

    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test this is a test for a valid dsize value 1 <> 2
 *
 */
static int DsizeTestParse05(void)
{
    DetectDsizeData *dd = DetectDsizeParse(" 1 <> 2 ");
    FAIL_IF_NULL(dd);
    FAIL_IF_NOT(dd->dsize == 1);
    FAIL_IF_NOT(dd->dsize2 == 2);
    FAIL_IF_NOT(dd->mode == DETECTDSIZE_RA);

    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test this is test for a valid dsize value > 2
 *
 */
static int DsizeTestParse06(void)
{
    DetectDsizeData *dd = DetectDsizeParse("> 2 ");
    FAIL_IF_NULL(dd);
    FAIL_IF_NOT(dd->dsize == 2);
    FAIL_IF_NOT(dd->mode == DETECTDSIZE_GT);

    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test test for a valid dsize value <   12
 *
 */
static int DsizeTestParse07(void)
{
    DetectDsizeData *dd = DetectDsizeParse("<   12 ");
    FAIL_IF_NULL(dd);
    FAIL_IF_NOT(dd->dsize == 12);
    FAIL_IF_NOT(dd->mode == DETECTDSIZE_LT);

    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test test for a valid dsize value    12
 *
 */
static int DsizeTestParse08(void)
{
    DetectDsizeData *dd = DetectDsizeParse("   12 ");
    FAIL_IF_NULL(dd);
    FAIL_IF_NOT(dd->dsize == 12);
    FAIL_IF_NOT(dd->mode == DETECTDSIZE_EQ);

    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test this is a test for a valid dsize value !1
 *
 */
static int DsizeTestParse09(void)
{
    DetectDsizeData *dd = DetectDsizeParse("!1");
    FAIL_IF_NULL(dd);
    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test this is a test for a valid dsize value ! 1
 *
 */
static int DsizeTestParse10(void)
{
    DetectDsizeData *dd = DetectDsizeParse("! 1");
    FAIL_IF_NULL(dd);
    DetectDsizeFree(NULL, dd);
    PASS;
}

/**
 * \test this is a test for invalid dsize values
 * A, >10<>10, <>10, 1<>, "", " ", 2<>1, 1!
 *
 */
static int DsizeTestParse11(void)
{
    const char *strings[] = { "A", ">10<>10", "<>10", "1<>", "", " ", "2<>1", "1!", NULL };
    for (int i = 0; strings[i]; i++) {
        DetectDsizeData *dd = DetectDsizeParse(strings[i]);
        FAIL_IF_NOT_NULL(dd);
    }

    PASS;
}

/**
 * \test this is a test for positive ! dsize matching
 *
 */
static int DsizeTestMatch01(void)
{
    uint16_t psize = 1;
    uint16_t dsizelow = 2;
    uint16_t dsizehigh = 0;

    FAIL_IF_NOT(DsizeMatch(psize, DETECTDSIZE_NE, dsizelow, dsizehigh));

    PASS;
}

/**
 * \test this is a test for negative ! dsize matching
 *
 */
static int DsizeTestMatch02(void)
{
    uint16_t psize = 1;
    uint16_t dsizelow = 1;
    uint16_t dsizehigh = 0;

    FAIL_IF(DsizeMatch(psize, DETECTDSIZE_NE, dsizelow, dsizehigh));

    PASS;
}

/**
 * \test DetectDsizeIcmpv6Test01 is a test for checking the working of
 *       dsize keyword by creating 2 rules and matching a crafted packet
 *       against them. Only the first one shall trigger.
 */
static int DetectDsizeIcmpv6Test01(void)
{
    static uint8_t raw_icmpv6[] = {
        0x60, 0x00, 0x00, 0x00, 0x00, 0x30, 0x3a, 0xff,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xff, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
        0x01, 0x00, 0x7b, 0x85, 0x00, 0x00, 0x00, 0x00,
        0x60, 0x4b, 0xe8, 0xbd, 0x00, 0x00, 0x3b, 0xff,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xff, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01 };

    Packet *p = PacketGetFromAlloc();
    FAIL_IF_NULL(p);

    IPV6Hdr ip6h;
    ThreadVars tv;
    DecodeThreadVars dtv;
    ThreadVars th_v;
    DetectEngineThreadCtx *det_ctx = NULL;

    memset(&tv, 0, sizeof(ThreadVars));
    memset(&dtv, 0, sizeof(DecodeThreadVars));
    memset(&ip6h, 0, sizeof(IPV6Hdr));
    memset(&th_v, 0, sizeof(ThreadVars));

    FlowInitConfig(FLOW_QUIET);
    p->src.family = AF_INET6;
    p->dst.family = AF_INET6;
    p->ip6h = &ip6h;

    DecodeIPV6(&tv, &dtv, p, raw_icmpv6, sizeof(raw_icmpv6));

    DetectEngineCtx *de_ctx = DetectEngineCtxInit();
    FAIL_IF_NULL(de_ctx);

    de_ctx->flags |= DE_QUIET;

    Signature *s = DetectEngineAppendSig(de_ctx,
            "alert icmp any any -> any any "
            "(msg:\"ICMP Large ICMP Packet\"; dsize:>8; sid:1; rev:4;)");
    FAIL_IF_NULL(s);

    s = DetectEngineAppendSig(de_ctx,
            "alert icmp any any -> any any "
            "(msg:\"ICMP Large ICMP Packet\"; dsize:>800; sid:2; rev:4;)");
    FAIL_IF_NULL(s);

    SigGroupBuild(de_ctx);
    DetectEngineThreadCtxInit(&th_v, (void *)de_ctx, (void *)&det_ctx);

    SigMatchSignatures(&th_v, de_ctx, det_ctx, p);
    FAIL_IF(PacketAlertCheck(p, 1) == 0);
    FAIL_IF(PacketAlertCheck(p, 2));

    DetectEngineThreadCtxDeinit(&th_v, (void *)det_ctx);
    DetectEngineCtxFree(de_ctx);

    PACKET_RECYCLE(p);
    FlowShutdown();
    SCFree(p);

    PASS;
}

/**
 * \brief this function registers unit tests for dsize
 */
static void DsizeRegisterTests(void)
{
    UtRegisterTest("DsizeTestParse01", DsizeTestParse01);
    UtRegisterTest("DsizeTestParse02", DsizeTestParse02);
    UtRegisterTest("DsizeTestParse03", DsizeTestParse03);
    UtRegisterTest("DsizeTestParse04", DsizeTestParse04);
    UtRegisterTest("DsizeTestParse05", DsizeTestParse05);
    UtRegisterTest("DsizeTestParse06", DsizeTestParse06);
    UtRegisterTest("DsizeTestParse07", DsizeTestParse07);
    UtRegisterTest("DsizeTestParse08", DsizeTestParse08);
    UtRegisterTest("DsizeTestParse09", DsizeTestParse09);
    UtRegisterTest("DsizeTestParse10", DsizeTestParse10);
    UtRegisterTest("DsizeTestParse11", DsizeTestParse11);
    UtRegisterTest("DsizeTestMatch01", DsizeTestMatch01);
    UtRegisterTest("DsizeTestMatch02", DsizeTestMatch02);

    UtRegisterTest("DetectDsizeIcmpv6Test01", DetectDsizeIcmpv6Test01);
}
#endif /* UNITTESTS */
