$.ajaxSetup({
    cache: false
});


var csrf_token = $('#csrf_token')[0].value;


// 请求角色
var roles;
$.ajax({
    type: 'POST',
    url: '/roles_index',
    data: {'field': 'show_all', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata){
            alert(rows_data.userdata);
            return 0;
        }
        roles = rows_data.rows;
        //fill roles list
        for (var r in roles){
            $("#role_list").append("<option value='"+roles[r].role_name+"'>"+roles[r].role_name+"</option>");
        }
        if (rows_data.userdata){
            alert(rows_data.userdata);
        }
    }
});


var colModel = [
    {field: 'status', checkbox: true},
    {field: 'Number', title : '行号',  align: 'center', width: 35, formatter : function(value, row, index) {return index+1;}},
    {field: 'id', title: 'id', visible: false, sortable: true},
    {field: 'version', title: 'version', visible: false},
    {field: 'user_name', title: '用户', sortable: true},
    {field: 'department', title: '部门', sortable: true},
    {field: 'title', title: '职位', sortable: true},
    {field: 'mail_name', title: '域用户名', sortable: true},
    {field: 'role', title: '角色', sortable: true},
    {field: 'active', title: '使用状态', sortable: true},
    {field: 'staff', title: '在职', sortable: true},
    {field: 'create_time', title: '创建时间', visible: false, sortable: true},
    {field: 'delete_status', title: 'delete_status', visible: false, sortable: true}];


// 创建权限表格
$('#permissionJqGrid').bootstrapTable({
    columns: colModel,

    pagination: true,
    // height: 800,
    sidePagination: 'server',
    idField: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    showExport: true,
    exportOptions: {fileName: '用户'},
    striped: true,
    showToggle: true,
    showColumns: true,
    // detailView: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#permission-toolbar",
    showPaginationSwitch: 'true',

    queryParams: permissionQueryParameters,

    ajaxOptions: {
        url: '/permissions_index',
        method: 'post',
        data: {field: 'show_all', name: '', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: parserResponding
});


// ISP Query参数
function permissionQueryParameters(params) {
    var _params = getQueryParameters(params, 'user_name', 20, csrf_token);
    if (_params.sort == 'role'){
        _params.sort = 'role_id';
    }
    _params.field = 'show_all';
    return _params;
}



$(".switch input").bootstrapSwitch('state', false);


$("#index_button").click(function () {

    var _data = $("#index_form").serializeArray();

    $('#permissionJqGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params){
            var para = permissionQueryParameters(params);
            var data = jQuery.extend(true, [], _data);

            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': 0});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            return data;
        },

        ajaxOptions: {
            url: '/permissions_index',
            method: 'post',
            data: _data
        }
    });
    hideSpecialItem(hiddenFields);
});


//编辑权限
$("#edit_button").click(function () {
    var item = getSelected('#permissionJqGrid', true, false);
    if (item === null){
        return null;
    }
    item = item[0];
    var document = $("#permissionModal");
    formfiller(item, document);
    document.modal('show');

    for (var i in roles){
        if (item['role'] == roles[i].role_name){
            item['allowed'] = roles[i].allowed + roles[i].allowed_full;
        }
    }
    changeSwitchState(item.allowed, true);
});


// 编辑保存
$("#save_confirm").click(function () {
    getDataAndUpdateGrid(
        "#save_confirm",
        '/permissions_edit',
        'POST',
        '#detail_form',
        '',
        "#permissionJqGrid",
        'server',
        "#permissionModal"
    );
});


$("#role_list").change(function () {
    for (var i in roles){
        if (this.value == roles[i].role_name){
            var allowed = roles[i].allowed;
            changeSwitchState(allowed, true);
        }
    }
});



$("#sync_button").click(function () {
    showMessage('#sync_button', '/permissions_edit', 'GET', null);
});



// 监听搜索回车事件
$("#index_permissions").bind("keydown", function (e) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        return false;
    }
});


// 监听修改回车事件
$("#permissionModal").bind("keydown", function (e) {
        pressEnter(e, "#save_confirm")
    });


var hiddenFields = ['status', 'id', 'version', 'create_time', 'delete_status'];
$(document).ready(function(){
    // 表格高度适应
    var top = $('#permissionJqGrid').offset().top;
    adjustSize("#permissionJqGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#permissionJqGrid", top, 30);
        // 隐藏特殊列
        hideSpecialItem(hiddenFields);
    });

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});
