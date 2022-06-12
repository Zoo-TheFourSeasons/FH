$.ajaxSetup({
    cache: false
});


var csrf_token = $('#csrf_token')[0].value;


// IDC信息表格
var spareIdcModel = [
    {field: 'status', checkbox: true},
    {
        field: 'Number', title: '行号', align: 'center', width: 35, formatter: function (value, row, index) {
        return index + 1;
    }
    },
    {title: 'id', field: 'id', visible: false, sortable: true},
    {title: 'version', field: 'version', visible: false},
    {title: '硬件序列号', field: 'idc_hardware_serial', sortable: true, visible: false},

    {title: '系统密码', field: 'system_password', sortable: true, visible: false},
    {title: '转入时间', field: 'in_time', sortable: true, visible: false},
    {title: '转出时间', field: 'out_time', sortable: true, visible: false},
    {title: '类型', field: 'idc_type', sortable: true, visible: false},
    {title: '品牌型号', field: 'idc_brand_model', sortable: true, visible: false},
    {title: '管理地址', field: 'manage_ips', sortable: true, visible: false},
    {title: '物理主机OS主IP', field: 'physical_os_ips', sortable: true, visible: false},
    {title: 'IDC机房', field: 'idc_depository', sortable: true, visible: false},
    {title: '机柜', field: 'idc_cabinet', sortable: true, visible: false},
    {title: '机柜内编号', field: 'idc_in_cabinet', sortable: true, visible: false},
    {title: '主机OS', field: 'idc_os_type', sortable: true, visible: false},
    {title: '简明配置', field: 'idc_brief', sortable: true, visible: false},
    {title: '项目', field: 'idc_project', sortable: true, visible: false},
    {title: '业务', field: 'idc_business', sortable: true, visible: false},
    {title: '模块', field: 'module', sortable: true, visible: false},
    {title: '成本中心', field: 'idc_cost_center', sortable: true, visible: false},
    {title: '领用人', field: 'idc_recipient', sortable: true, visible: false},
    {title: '维护人', field: 'idc_maintainer', sortable: true, visible: false},
    {title: '联系人', field: 'idc_contact', sortable: true, visible: false},
    {title: '故障', field: 'idc_malfunction', sortable: true, visible: false},
    {title: '客户设备', field: 'is_customer', sortable: true, visible: false},

    {title: '创建时间', field: 'create_time', sortable: true, visible: false},
    {title: '刀片编号', field: 'blade', sortable: true, visible: false},
    {title: '备注', field: 'idc_remark', sortable: true, width: "10%", visible: false}];


// 特殊列排序转换
function exchangeFields(field) {
    if (field == 'module') {
        return 'idc_module';
    }
    else if (field == 'physical_os_ips') {
        return 'idc_physical_os_ips';
    }
    else if (field == 'manage_ips') {
        return 'idc_manage_ips';
    }
    else if (field == 'brief') {
        return 'idc_brief';
    }
    else{
        return field
    }
}


// 初始化表格
$('#spareIdcGrid').bootstrapTable({
    columns: spareIdcModel,
    pagination: true,
    sidePagination: 'server',
    idField: 'id',
    uniqueId: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    showExport: true,
    exportOptions: {fileName: 'IDC备机'},
    striped: true,
    showToggle: true,
    showColumns: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#toolbar",

    queryParams: spareIdcGETQueryParameters,

    ajaxOptions: {
        url: '/spare_idc_index',
        method: 'get',
        data: ''
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: spareIdcRespHandler
});


// GET查询参数
function spareIdcGETQueryParameters(params) {

    var _params = getQueryParameters(params, 'idc_hardware_serial', 20, csrf_token);
    // 转换特殊排序字段
    _params.sort = exchangeFields(_params.sort);
    _params.types = 'show_all';
    return _params;
}


// responseHandler
function spareIdcRespHandler(result) {
    var _result = parserResponding(result);
    for (var i = 0; i < _result.rows.length; i++) {
        addPhysicIPButton(_result.rows[i]);
        addManageIPBreak(_result.rows[i]);
        addModuleButton(_result.rows[i]);
    }
    return _result;
}


// 管理IP换行
function addManageIPBreak(item) {
    var manage_ip = item.idc_manage_ips.toString();
    var ips, ips_visible;
    ips = getIps(manage_ip);
    if (ips != null) {
        if (ips.length > 0) {
            ips_visible = ips.join("<br>");
        }
        ips_visible += "</a>";
        item.manage_ips = ips_visible;
    }
}


// 增加模块按钮
function addModuleButton(item) {
    var module = item.idc_module;
    var modules, modules_visible, modules_invisible, invisible_ids;
    if (module.length != 0) {
        modules = module.split(';');
        modules_visible = "";
        modules_invisible = "";
        if (modules && modules.length > 0) {
            modules_visible = modules.slice(0, 4).join("<br>");
        }
        if (modules && modules.length > 4) {
            invisible_ids = "invisible_module_" + item.id;

            modules_invisible = modules.slice(4).join("<br>");
            modules_invisible = "<div  hidden id='" + invisible_ids + "'>" + modules_invisible + "</div>" + "<br>";
            modules_invisible = modules_invisible + '<a href=javascript:showIps(\"#' + invisible_ids + '"\)>更多</a>';
        }
        item.module = modules_visible + modules_invisible;
    }
}


// 增加物理IP按钮
function addPhysicIPButton(item) {
    var physical_ips = item.idc_physical_os_ips.toString();
    var ips, ips_visible, ips_invisible, invisible_id;
    ips = getIps(physical_ips);
    if (ips != null) {
        ips_visible = "";
        ips_invisible = "";
        if (ips.length > 0) {

            ips_visible = ips.slice(0, 4).join("<br>");
        }
        if (ips.length > 4) {
            invisible_id = "invisible_ip_" + item.id;

            ips_invisible = ips.slice(4).join("<br>");
            ips_invisible = "<div  hidden id='" + invisible_id + "'>" + ips_invisible + "</div>" + "<br>";
            ips_invisible = ips_invisible + '<a href=javascript:showIps(\"#' + invisible_id + '"\)>更多</a>';
        }
        item.physical_os_ips = ips_visible + ips_invisible;
    }
}


// 条件查询
$("#spare_index").click(function () {
    var _form = $("#spareIdcIndexForm");
    var _data = _form.serializeArray();

    $('#spareIdcGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params){
            var para = idcInfoGETQueryParameters(params);
            var data = jQuery.extend(true, [], _data);
            // 加入分页 排序参数
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': para.offset});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});
            data.push({'name': 'types', 'value': 'index'});
            // 加入 查询类型
            return data;
        }
    });
    hideSpecialItem(hiddenFields);
    _form[0].reset();

});


// 编辑IDC信息
$("#edit_button").click(function () {
    var item = getSelected('#spareIdcGrid', true, false);
    if (item === null){
        return null;
    }

    item = item[0];
    var physical_os_ips = getIps(item.idc_physical_os_ips);
    if (physical_os_ips == null) {
        item.idc_physical_os_ips = '';
    } else {
        item.idc_physical_os_ips = physical_os_ips.join("\n");
    }
    //恢复模块 简明配置信息为原始数据
    var module = item.idc_module.split(';');
    if (module){
        item.idc_module = module.join("\n");
    }
    formfiller(item, $("#documentModal"));
    $("#documentModal").modal('show');
});


// 保存编辑
$("#save_confirm").click(function () {
    updateGrid(
        "#save_confirm",
        '/spare_idc_edit',
        'POST',
        '#detail_form',
        '',
        "#spareIdcGrid",
        "#documentModal"
    );
});


// 删除备机信息
$("#delete_button").confirm({
    title: "删除备机信息",
    text: "确定删除该备机信息?",
    confirm: function () {
        var _data = getSelected("#spareIdcGrid", false, true);

        if (_data == null) {
            return null;
        }
        _data.push({'name': 'csrf_token', 'value': $('#csrf_token')[0].value});
        updateGrid(
            "#delete_button",
            '/spare_idc_delete',
            'POST',
            '',
            _data,
            "#spareIdcGrid",
            ""
        );
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 保存备机表格列
$("#save_spare_grid").click(function () {
    save_grids("#spareIdcGrid", 'spare_lines');
});


// 载入列
function loadFields() {
    var lis = $('#showLines').find('li');
    for (var i=0; i<lis.length; i++){
        $("#spareIdcGrid").bootstrapTable('showColumn', lis[i].textContent);
    }
}


var hiddenFields = ['status', 'id', 'version', 'create_time', 'idc_module'];
$(document).ready(function(){
    // 表格高度适应
    var top = $('#spareIdcGrid').offset().top;
    adjustSize("#spareIdcGrid", top, 30);

    $(window).resize(function() {
        adjustSize("#spareIdcGrid", top, 30);
        hideSpecialItem(hiddenFields);
    });

    loadFields();

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});


// 监听搜索回车事件
$("#spareIdcIndexForm").bind("keydown", function (e) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        //回车执行编辑
        $("#spare_index").click();
        return false;
    }
});


$(".datetimepicker").datetimepicker({
    format: 'yyyy-mm-dd',
    minView: 2,
    startView: 2,
    maxView: 4,
    language: 'zh-CN',
    autoclose: true
});


$("#start_in").datetimepicker( 'setDate' , new Date('2002-01-01'));
$("#ended_in").datetimepicker( 'setDate' , new Date('2102-01-01'));

// 编辑系统密码
$("#spareEdit").click(function () {
    var item = getSelected('#spareIdcGrid', true, false);
    if (item === null) {
        return null;
    }
    $("#spareEdit").attr('disabled', 'disabled');
    formfiller(item[0], $("#system_password_form"));
    $("#systemPwdModal").modal('show');
    $("#spareEdit").removeAttr('disabled');
});



// 保存备机系统密码
$("#system_psw_save").click(function () {
    $("#system_psw_save").attr('disabled', 'disabled');

    updateGrid(
        '#system_psw_save',
        '/spare_idc_edit',
        'POST',
        '#system_password_form',
        '',
        '#spareIdcGrid',
        '#systemPwdModal'
    );
});