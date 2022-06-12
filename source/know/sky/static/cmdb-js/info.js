$.ajaxSetup({
    cache: false
});


var csrf_token = $('#csrf_token')[0].value;


var colModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'module', title: '模块', sortable: true, width: 72},
    {field: 'operate', title: '操作', sortable: true, width: 37},
    {field: 'operator', title: '操作人员', sortable: true},
    {field: 'message', title: '信息', sortable: true},
    {field: 'level', title: '级别', sortable: true, width: 37},
    {field: 'has_read', title: '状态', sortable: true, width: 37},
    {field: 'create_time', title: '时间', sortable: true, width: 187},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


// 创建
$('#infoJqGrid').bootstrapTable({
    columns: colModel,

    pagination: true,
    sidePagination: 'server',
    idField: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000, 10000, 50000],
    striped: true,
    showExport: true,
    exportOptions: {fileName: '操作信息'},
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#info-toolbar",
    sortOrder: "desc",

    queryParams: infoQueryParameters,

    ajaxOptions: {
        url: '/info_index',
        method: 'get',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: infoRespHandler
});


// Query参数
function infoQueryParameters(params) {
    var _params = getQueryParameters(params, 'create_time', 20, csrf_token);
    _params.field = 'show_all';
    return _params;
}


// responseHandler
function infoRespHandler(result){
    for (var i = 0; i < result.rows.length; i++) {
        var status = result.rows[i].has_read;
        if (status == '未读') {
            status = '<a href=javascript:changeStatus(\"' + result.rows[i].id + '"\)>' + status + '</a>';
        }
        result.rows[i].has_read = status;
    }
    return result;
}


function changeStatus(i) {
    $.ajax({
        type: 'POST',
        url: '/info_edit',
        // async: true,
        data: {'id': i},
        success: function (rows_data) {
            if (rows_data.userdata){
                alert(rows_data.userdata);
                return 0;
            }
            $("#infoJqGrid").bootstrapTable('refresh');
            if (rows_data.message){
                alert(rows_data.message);
            }
            // 刷新未读数
            $('#unread')[0].innerText = rows_data.unread;
        }
    });
}

// 条件搜索
$("#indexButton").click(function () {

    var _data = $("#index_form").serializeArray();

    $('#infoJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params){
            var para = infoQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': para.offset});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        ajaxOptions: {
            url: '/info_index',
            method: 'post',
            data: _data
        }
    });
    hideSpecialItem(hiddenFields);
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    // 表格高度适应
    var top = $('#infoJqGrid').offset().top;
    adjustSize("#infoJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#infoJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
