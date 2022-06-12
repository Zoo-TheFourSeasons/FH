$.ajaxSetup({
    cache: false
});

var csrf_token = $('#csrf_token')[0].value;


var departmentModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'department', title: '部门(公司)', sortable: true},
    {field: 'account', title: '人数', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


var idcInfoContactModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'department', title: '部门(公司)', sortable: true},
    {field: 'idc_contact', title: '联系人', sortable: true},
    {field: 'account', title: 'IDC信息数', sortable: true},
    {field: 'contact_phone', title: '电话', sortable: true},
    {field: 'contact_email', title: '邮箱', sortable: true},
    {field: 'contact_qq', title: 'QQ', sortable: true},
    {field: 'mail_name', title: '公司职员', sortable: true},
    {field: 'remark', title: '备注', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: '是否已删除', visible: false}];


var firstLoad = true;


// 查询部门(公司)
$.ajax({
    type: 'POST',
    url: '/contact_department_index',
    async: true,
    data: {'department': '', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata) {
            alert(rows_data.userdata);
            return 0;
        }
        var departments = rows_data.rows;
        for (var r = 0; r < departments.length; r++) {
            var s = "<option value='" + departments[r].department + "'>" + departments[r].department + "</option>";
            $("#departmentCreate").append(s);
            $("#departmentEdit").append(s);
            $("#departmentIndex").append(s);
        }
        $('#departmentIndex').selectpicker("refresh");
        $('#departmentCreate').selectpicker("refresh");
        $('#departmentEdit').selectpicker("refresh");
    }
});


// 查询域用户
$.ajax({
    type: 'POST',
    url: '/permissions_index',
    async: true,
    data: {'field': 'show_all', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata) {
            alert(rows_data.userdata);
            return 0;
        }
        var rows = rows_data.rows;
        for (var r = 0; r < rows.length; r++) {
            var temp = rows[r];
            var s = "<option data-mail_name='" + temp.mail_name + "' data-department='" + temp.department + "' data-user_name='" + temp.user_name + "'>"
                + temp.user_name + ', ' + temp.department + ', ' + temp.mail_name + "</option>";
            $('#skyUser').append(s);
        }
        $('#skyUser').selectpicker("refresh");
    }
});


// 查询IDC联系人
$.ajax({
    type: 'GET',
    url: '/idc_info_contact_index',
    async: true,
    data: {'field': 'show_all', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata) {
            alert(rows_data.userdata);
            return 0;
        }
        // 首次加载数据
        if (firstLoad) {
            // 载入数据到idcInfo Contact Switch Modal

            var idc_contact_a = $("#idc_contact_a");
            var idc_contact_b = $("#idc_contact_b");

            for (var i = 0; i < rows_data.rows.length; i++) {
                var contact = rows_data.rows[i].idc_contact;
                var op = "<option value='" + contact + "'>" + contact + "</option>";
                idc_contact_a.append(op);
                idc_contact_b.append(op)
            }
            // 刷新
            idc_contact_a.selectpicker("refresh");
            idc_contact_b.selectpicker("refresh");
            // 标记
            firstLoad = false;
        }
    }
});


// 域用户选择事件
$('#skyUser').on('change', function () {
    var selected = $(this).find("option:selected");
    if (selected.val() == '') {
        $("#idc_contact_create").val('');
        $("#mail_name_create").val('');
        return false;
    }
    // 填充部门
    var dep = selected.attr("data-department");
    var departmentCreate = $("#departmentCreate");
    var opt = departmentCreate.find("option");
    var exist = false;
    for (var op = 0; op < opt.length; op++) {
        if (opt[op].value == dep) {
            departmentCreate.val(dep);
            departmentCreate.selectpicker("refresh");
            exist = true;
            break;
        }
    }
    // 部门不存在提示
    if (!exist) {
        $("#idc_contact_create").val('');
        $("#mail_name_create").val('');
        alert('该部门(公司)不存在, 请先添加: ' + dep);
        return false;
    }
    // 填充名称, 域账号
    $("#idc_contact_create").val(selected.attr("data-user_name"));
    $("#mail_name_create").val(selected.attr("data-mail_name"));
});


// 联系人部门(公司)
$("#departmentJqGrid").bootstrapTable({
    columns: departmentModel,

    pagination: true,
    // height: 800,
    sidePagination: 'client',
    idField: 'id',
    uniqueId: 'id',
    paginationVAlign: 'top',
    pageSize: 10,
    pageNumber: 1,
    pageList: [10, 25],
    striped: true,
    // showRefresh: true,
    showToggle: true,
    showColumns: true,
    // detailView: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#department-toolbar",
    showPaginationSwitch: 'true'

    // queryParams: departmentPOSTParameters,
    //
    // ajaxOptions: {
    //     url: '/contact_department_index',
    //     method: 'post',
    //     data: {department: '', csrf_token: csrf_token}
    // },
    //
    // ajax: function (request) {
    //     $.ajax(request);
    // },
    //
    // responseHandler: parserResponding
});


function getDepartment() {
    updateGrid(
        '',
        '/contact_department_index',
        'POST',
        '',
        {department: '', csrf_token: csrf_token},
        '#departmentJqGrid',
        ''
    );
}


// POST查询参数
function departmentPOSTParameters(params) {
    var _params = getQueryParameters(params, 'department', 10, csrf_token);
    _params.department = '';
    return _params;
}


// 联系人
$("#contactJqGrid").bootstrapTable({
    columns: idcInfoContactModel,

    pagination: true,
    // height: 800,
    sidePagination: 'client',
    idField: 'id',
    uniqueId: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    showExport: true,
    exportOptions: {fileName: 'IDC联系人'},
    striped: true,
    showToggle: true,
    showColumns: true,
    // detailView: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#info-contact-toolbar",
    showPaginationSwitch: 'true'

    // queryParams: contactGETParameters,
    //
    // ajaxOptions: {
    //     url: '/idc_info_contact_index',
    //     method: 'get',
    //     data: {field: 'show_all', csrf_token: csrf_token}
    // },
    //
    // ajax: function (request) {
    //     $.ajax(request);
    // },
    //
    // responseHandler: parserResponding
});


function getContact() {
    updateGrid(
        '',
        '/idc_info_contact_index',
        'GET',
        '',
        {field: 'show_all', csrf_token: csrf_token},
        '#contactJqGrid',
        ''
    );
}


// GET查询参数
function contactGETParameters(params) {

    var _params = getQueryParameters(params, 'idc_contact', 20, csrf_token);
    _params.field = 'show_all';

    if (_params.sort == 'department'){
        _params.sort = 'department_id'
    }

    return _params;
}


// 索引联系人部门(公司)
$("#show_department_button").click(function () {
    var _data = {'department': $("#department")[0].value, 'csrf_token': csrf_token};
    updateGrid(
        "#create_button",
        '/contact_department_index',
        'POST',
        '',
        _data,
        "#departmentJqGrid",
        ""
    );
    // $('#departmentJqGrid').bootstrapTable('refresh', {query: _data});
});


// 创建联系人部门(公司)
$("#create_department_button").click(function () {
    updateGrid(
        "#create_department_button",
        '/contact_department_create',
        'POST',
        '#contact_department_create_form',
        '',
        "#departmentJqGrid",
        ""
    );
});


// 编辑联系人部门(公司)
$("#edit_department_button").click(function () {
    var item = getSelected('#departmentJqGrid', true, false);
    if (item === null) {
        return null;
    }
    var document = $("#contactDepartmentEditModal");
    formfiller(item[0], document);
    document.modal('show');
});


// 编辑保存联系人部门(公司)
$("#contactDepartmentEditSave").click(function () {
    updateGrid(
        "#contactDepartmentEditSave",
        '/contact_department_edit',
        'POST',
        '#contactDepartmentEditForm',
        '',
        "#departmentJqGrid",
        "#contactDepartmentEditModal"
    );
});


// 删除联系人部门(公司)
$("#delete_department_button").confirm({
    title: "删除ISP",
    text: "确定删除该部门(公司)?",
    confirm: function () {
        var _data = getSelected("#departmentJqGrid", false, true);

        if (_data == null) {
            return null;
        }
        _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        updateGrid(
            "#delete_department_button",
            '/contact_department_delete',
            'POST',
            '',
            _data,
            "#departmentJqGrid",
            ""
        );

        // deleteSelectedItems("#delete_department_button", "#departmentJqGrid", '/contact_department_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 索引IDC信息联系人
$("#idcInfoContactIndexBtn").click(function () {
    updateGrid(
        "#idcInfoContactIndexBtn",
        '/idc_info_contact_index',
        'POST',
        '#idcInfoContactIndexForm',
        '',
        "#contactJqGrid",
        ""
    );

    // $('#contactJqGrid').bootstrapTable('refreshOptions', {
    //     queryParams: function (params){
    //         var para = contactGETParameters(params);
    //         var data = jQuery.extend(true, [], _data);
    //
    //         // 加入分页 排序参数
    //         if (params.sort == 'department'){
    //             params.sort = 'department_id'
    //         }
    //
    //         data.push({'name': 'limit', 'value': para.limit});
    //         data.push({'name': 'offset', 'value': para.offset});
    //         data.push({'name': 'sort', 'value': para.sort});
    //         data.push({'name': 'order', 'value': para.order});
    //         return data;
    //     },
    //
    //     ajaxOptions: {
    //         url: '/idc_info_contact_index',
    //         method: 'post',
    //         data: _data
    //     }
    // });
});


// 创建IDC信息联系人
$("#create_contact_button").click(function () {
    $("#idcInfoContactCreateModal").modal('show');
    // 域用户选择框重置
    $('#skyUser').selectpicker("refresh");
});


// 保存创建IDC信息联系人
$("#idcInfoContactCreateSave").click(function () {
    updateGrid(
        "#idcInfoContactCreateSave",
        '/idc_info_contact_create',
        'POST',
        '#idcInfoContactCreateForm',
        '',
        "#contactJqGrid",
        "#idcInfoContactCreateModal"
    );
    $('#departmentCreate').selectpicker("refresh");
});


// 编辑IDC信息联系人
$("#edit_contact_button").click(function () {
    var item = getSelected('#contactJqGrid', true, false);
    if (item === null){
        return null;
    }
    var document = $("#idcInfoContactEditModal");
    formfiller(item[0], document);
    document.modal('show');

    $('#departmentEdit').selectpicker('val', item[0].department);
});


// 保存编辑IDC信息联系人
$("#idcInfoContactEditSave").click(function () {
    updateGrid(
        "#idcInfoContactEditSave",
        '/idc_info_contact_edit',
        'POST',
        '#idcInfoContactEditForm',
        '',
        "#contactJqGrid",
        "#idcInfoContactEditModal"
    );
});


// 删除IDC信息联系人
$("#delete_contact_button").confirm({
    title: "删除IDC信息联系人",
    text: "确定删除该IDC信息联系人?",
    confirm: function () {
        var _data = getSelected("#contactJqGrid", false, true);

        if (_data == null) {
            return null;
        }
        _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        updateGrid(
            "#delete_contact_button",
            '/idc_info_contact_delete',
            'POST',
            '',
            _data,
            "#contactJqGrid",
            ""
        );

        // deleteSelectedItems("#delete_contact_button", "#contactJqGrid", '/idc_info_contact_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 转移IDC信息联系人
$("#switch_contact_button").click(function () {
    $("#contactSwitchModal").modal('show');
});


$("#contactSwitchSave").click(function () {

    updateGrid(
        '#contactSwitchSave',
        '/idc_info_contact_switch',
        'POST',
        '#contactSwitchForm',
        '',
        '#contactJqGrid',
        '#contactSwitchModal'
    );
    // var data = $("#contactSwitchForm").serializeArray();
    // $.ajax({
    //     type: 'POST',
    //     url: '/idc_info_contact_switch',
    //     async: true,
    //     data: data,
    //     success: function (rows_data) {
    //         if (rows_data.userdata) {
    //             alert(rows_data.userdata);
    //             return 0;
    //         }
    //         if (rows_data.message) {
    //             $("#contactSwitchModal").modal('hide');
    //             alert(rows_data.message);
    //             // 刷新Grid
    //             $('#contactJqGrid').bootstrapTable('refresh');
    //         }
    //     }
    // });
});


// 监听搜索 联系人回车事件
$("#index_contact").bind("keydown", function (e) {
    pressEnter(e, "#idcInfoContactIndexBtn");
});


// 监听创建 联系人回车事件
$("#idcInfoContactCreateModal").bind("keydown", function (e) {
    pressEnter(e, "#idcInfoContactCreateSave");
});


// 监听修改 联系人回车事件
$("#idcInfoContactEditModal").bind("keydown", function (e) {
    pressEnter(e, "#idcInfoContactEditSave");
});


// 禁用搜索 部门(公司)回车事件
$("#department-toolbar").bind("keydown", function (e) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        return false;
    }
});


// 监听编辑 部门(公司)回车事件
$("#contactDepartmentEditModal").bind("keydown", function (e) {
    pressEnter(e, "#contactDepartmentEditSave")
});


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    getDepartment();
    getContact();

    // 表格高度适应
    var top = $('#contactJqGrid').offset().top;
    adjustSize("#contactJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#contactJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
