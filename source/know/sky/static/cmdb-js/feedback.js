$.ajaxSetup({
    cache: false
});


var csrf_token = $('#csrf_token')[0].value;


var colModel = [
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'version', title: 'version', visible: false},
    {field: 'title', title: '主题', sortable: true},
    {field: 'creator', title: '创建者'},
    {field: 'level', title: '等级', sortable: true},
    {field: 'status', title: '状态', sortable: true},
    {field: 'account', title: '评论数'},
    {field: 'create_time', title: '创建时间', sortable: true}];


// 创建
function initFeedback() {
    var feedbackJqGrid = $('#feedbackJqGrid');
    feedbackJqGrid.bootstrapTable('destroy');
    feedbackJqGrid.bootstrapTable({
        columns: colModel,
        pagination: true,
        sidePagination: 'server',
        idField: 'id',
        uniqueId: 'id',
        paginationVAlign: 'top',
        pageSize: 20,
        pageNumber: 1,
        pageList: [20, 50, 100, 500],
        striped: true,
        showExport: true,
        exportOptions: {fileName: '反馈信息'},
        showToggle: true,
        showColumns: true,
        paginationHAlign: 'left',
        paginationDetailHAlign: 'right',
        toolbarAlign: 'left',
        toolbar: "#feedback-toolbar",
        sortOrder: "desc",
        onRefresh: initFeedback,
        queryParams: feedbackQueryParameters,

        ajaxOptions: {
            url: '/feedback_index',
            method: 'post',
            data: {field: 'show_all', csrf_token: csrf_token}
        },

        ajax: function (request) {
            $.ajax(request);
        },

        responseHandler: feedbackRespHandler
    });
}



// Query参数
function feedbackQueryParameters(params) {
    var _params = getQueryParameters(params, 'create_time', 20, csrf_token);
    _params.field = 'show_all';
    return _params;
}


// responseHandler
function feedbackRespHandler(result) {
    var _result = parserResponding(result);
    if (_result.rows){
        for (var i = 0; i < _result.rows.length; i++) {
            _result.rows[i].title = '<a target="_blank" href="feedback/' + _result.rows[i].id + '">' + _result.rows[i].title + '</a>';
        }
    }
    return _result;
}


$("#feedbackCreateBtn").click(function () {
    $("#feedbackModal").modal('show');
});


// 提交反馈
$("#feedbackCommitBtn").click(function () {
    updateGrid(
        "#feedbackCommitBtn",
        '/feedback_create',
        'POST',
        '#detail_form',
        '',
        "#feedbackJqGrid",
        "#feedbackModal"
    );
});


// 条件搜索反馈
$("#feedbackIndexBtn").click(function () {

    var _data = $("#feedback_index_form").serializeArray();

    $('#feedbackJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params) {
            var para = feedbackQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': para.offset});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        // ajaxOptions: {
        //     url: '/info_index',
        //     method: 'post',
        //     data: _data
        // }
    });
});


var hiddenFields = ['id', 'version', 'create_time', 'delete_status'];
$(document).ready(function () {
    initFeedback();
    // 表格高度适应
    var top = $('#feedbackJqGrid').offset().top;
    adjustSize("#feedbackJqGrid", top, 30);

    $(window).resize(function () {
        adjustSize("#feedbackJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});

