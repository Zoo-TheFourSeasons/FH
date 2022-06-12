//$(function(){
//    $(window).on("resize",changeWidthHeight);
//    changeWidthHeight.call(window);
//});
//function changeWidthHeight(){
//    $("#right").hide();
//    var winH = $(this).height();
//    var winW = $(this).width();
//    var headerH = $("#header").height();
//    var leftW = $("#left").outerWidth(true);
//    var middleH = Math.max((winH - headerH),400);
//    var middleW = Math.max(winW,1000);
//    $("#middle").height(middleH).width(middleW);
//    $("#left").height(middleH);
//    $("#right").height(middleH).width(middleW - leftW).show();
//
//    if (typeof(window.layoutComplete) === 'undefined') {
//        window.layoutComplete = true;
//        $(window).trigger('layoutcomplete');
//    }
//}

/* 计算 grid 表格的高度，将 CSS 写入 head */
$(window).load(function() {
    var dynCss = $('<style>').attr('type', 'text/css').appendTo('head');

    var dynamicCss = function() {
        var gridViewHeight = $('#middle').height() - 165;
        gridViewHeight = Math.max(300, gridViewHeight);

        dynCss.html('\n' +
            '#dotm-grid-data {height: '+ gridViewHeight +'px; }' +
            '\n');
    };

    dynamicCss();
    $(window).on("resize", dynamicCss);
});


//DIV SPY
!function ($) {
    "use strict"; // jshint ;_;
    /* DIV SPY CLASS DEFINITION
     * ========================== */

    function DivSpy(element, options) {
        var process = $.proxy(this.process, this)
            , $element = $(element).is('body') ? $(window) : $(element)
            , $divscroll = $($(element).data('divScroll'))||$(element)
            , href
        this.options = $.extend({}, $.fn.divspy.defaults, options)
        this.$scrollElement = $divscroll.on('scroll.div-spy.data-api', process)
        this.selector = (this.options.divSelector
        || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        || '')
        this.$body = $('body')
        this.refresh()
        this.process()
    }

    DivSpy.prototype = {

        constructor: DivSpy

        , refresh: function () {
            var self = this
                , $targets

            this.offsets = $([])
            this.targets = $([])

            $targets = this.$body
                .find(this.selector)
                .map(function () {
                    var $el = $(this)
                        , href = $el.data('target') || $el.attr('href')
                        , $href = /^#\w/.test(href) && $(href)
                    return ( $href
                        && $href.length
                        && [[ $href.position().top, href ]] ) || null
                })
                .sort(function (a, b) { return a[0] - b[0] })
                .each(function () {
                    self.offsets.push(this[0])
                    self.targets.push(this[1])
                })
        }

        , process: function () {
            var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
                , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
                , maxScroll = scrollHeight - this.$scrollElement.height()
                , offsets = this.offsets
                , targets = this.targets
                , activeTarget = this.activeTarget
                , i
            if (scrollTop >= maxScroll) {
                return activeTarget != (i = targets.last()[0])
                    && this.activate ( i )
            }

            for (i = offsets.length; i--;) {
                activeTarget != targets[i]
                && scrollTop >= offsets[i]
                && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
                && this.activate( targets[i] )
            }
        }

        , activate: function (target) {
            var active
                , selector

            this.activeTarget = target

            $(this.selector)
                .removeClass('active')

            selector = this.selector
                + '[data-target="' + target + '"],'
                + this.selector + '[href="' + target + '"]'

            active = $(selector)
                .addClass('active')

            if (active.parent('.dropdown-menu').length)  {
                active = active.closest('li.dropdown').addClass('active')
            }

            active.trigger('activate')
        }

    }


    /* DIV SPY PLUGIN DEFINITION
     * =========================== */

    $.fn.divspy = function (option) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('divspy')
                , options = typeof option == 'object' && option
            if (!data) $this.data('divspy', (data = new DivSpy(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.divspy.Constructor = DivSpy

    $.fn.divspy.defaults = {
        offset: 10
    }


    /* DIV SPY DATA-API
     * ================== */

    $(window).on('load', function () {
        $('[data-div-spy="scroll"]').each(function () {
            var $div = $(this)
            $div.divspy($div.data())
        })
    })

}(window.jQuery);