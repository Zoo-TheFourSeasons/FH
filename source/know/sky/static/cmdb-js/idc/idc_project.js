$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;

var colModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false, sortable: true},
    {field: 'idc_project', title: '项目', sortable: true},
    {field: 'idc_cost_center', title: '成本中心', sortable: true},
    {field: 'account', title: '设备数', sortable: true},
    {field: 'server_count', title: '服务器数', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


// 创建项目表格
$('#projectJqGrid').bootstrapTable({

    columns: colModel,
    pagination: true,
    sidePagination: 'client',
    idField: 'id',
    uniqueId: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    showExport: true,
    exportOptions: {fileName: 'IDC项目'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#project-toolbar",
    showPaginationSwitch: 'true'

});

function getProject() {
    updateGrid(
        '',
        '/idc_project_index',
        'POST',
        '',
        {field: 'show_all', csrf_token: csrf_token},
        '#projectJqGrid',
        ''
    );
    // $.ajax({
    //     type: "POST",
    //     url: '/idc_project_index',
    //     data: {field: 'show_all', csrf_token: csrf_token},
    //     async: true,
    //     success: function (rows_data) {
    //         if (rows_data.userdata){
    //             alert(rows_data.userdata);
    //             return 0;
    //         }
    //
    //         $("#projectJqGrid").bootstrapTable('load', rows_data.rows);
    //     }
    // });
}


// Query 查询参数
function projectQueryParameters(params) {
    var _params = getQueryParameters(params, 'idc_project', 20, csrf_token);
    if (_params.sort == 'idc_cost_center'){
        _params.sort = 'idc_cost_center_id';
    }
    _params.field = 'show_all';
    return _params;
}


// 获取IDC项目
$.ajax({
    type: 'POST',
    url: '/idc_cost_center_index',
    async: true,
    data: {'field': 'show_all', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata) {
            alert(rows_data.userdata);
            return 0;
        }
        // 载入成本中心数据
        var rows = rows_data.rows;
        for (var r = 0; r < rows.length; r++) {
            var top = "<option value='" + rows[r].idc_cost_center + "'>" + rows[r].idc_cost_center + "</option>";
            $("#project_cost_center_edit").append(top);
            $("#project_cost_center_create").append(top);
            $("#project_cost_center_index").append(top);
        }
        // 刷新
        $('#project_cost_center_create').selectpicker("refresh");
        $('#project_cost_center_edit').selectpicker("refresh");
        $('#project_cost_center_index').selectpicker("refresh");
    }
});


// 创建IDC项目
$("#create_button").click(function () {
    getDataAndUpdateGrid(
        "#create_button",
        '/idc_project_create',
        'POST',
        '#idc_project_create_form',
        '',
        "#projectJqGrid",
        "#documentModal"
    );
    $('#project_cost_center_create').selectpicker("refresh");
});


// 搜索IDC项目
$("#index_button").click(function () {
    // var _data = $('#idcProjectIndexForm').serializeArray();
    $('#project_cost_center_index').selectpicker("refresh");
    updateGrid(
        '',
        '/idc_project_index',
        'POST',
        '#idcProjectIndexForm',
        '',
        '#projectJqGrid',
        ''
    );
    // $('#projectJqGrid').bootstrapTable('refreshOptions', {
    //     queryParams: function (params){
    //         var para = projectQueryParameters(params);
    //         var data = jQuery.extend(true, [], _data);
    //
    //         // 加入分页 排序参数
    //         data.push({'name': 'limit', 'value': para.limit});
    //         data.push({'name': 'offset', 'value': para.offset});
    //         data.push({'name': 'sort', 'value': para.sort});
    //         data.push({'name': 'order', 'value': para.order});
    //         return data;
    //     },
    //
    //     ajaxOptions: {
    //         url: '/idc_project_index',
    //         method: 'post',
    //         data: _data
    //     },
    //     ajax: function (request) {
    //         $.ajax(request);
    //     }
    // });
});


// 编辑IDC项目
$("#edit_button").click(function () {
    var item = getSelected('#projectJqGrid', true, false);
    if (item === null){
        return null;
    }
    var document = $("#documentModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 编辑保存
$("#save_confirm").click(function () {
    updateGrid(
        "#save_confirm",
        '/idc_project_edit',
        'POST',
        '#detail_form',
        '',
        "#projectJqGrid",
        "#documentModal"
    );
    $('#project_cost_center_edit').selectpicker("refresh");
});


// 删除IDC项目
$("#delete_button").confirm({
    title:"删除IDC业务",
    text:"确定是否删除该IDC项目? 若该成本中心下存在IDC设备信息, 则无法删除.",
    confirm: function() {
        var _data = getSelected("#projectJqGrid", false, true);

        if (_data == null) {
            return null;
        }
        _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        updateGrid(
            "#delete_button",
            '/idc_project_delete',
            'POST',
            '',
            _data,
            "#projectJqGrid",
            ""
        );
        // deleteSelectedItems("#delete_button", "#projectJqGrid", '/idc_project_delete', false);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 监听创建回车事件
$("#idc_project").keydown(function (e) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        return false;
    }
});


// 监听修改回车事件
$("#documentModal").keydown(function (e) {
    pressEnter(e, "#save_confirm");
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    getProject();
    // 表格高度适应
    var top = $('#projectJqGrid').offset().top;
    adjustSize("#projectJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#projectJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
