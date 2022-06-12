$.ajaxSetup({
    cache: false
});


var csrf_token = $('#csrf_token')[0].value;
// 请求IDC联系人列表
var referenced;


// 请求IDC联系人列表
$.ajax({
    type: 'POST',
    url: '/idc_info_contact_re_index',
    async: true,
    data: {'idc_contact': '', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata) {
            alert(rows_data.userdata);
            return 0;
        }
        var idc_contacts = rows_data.rows;
        for (var r = 0; r < idc_contacts.length; r++) {
            var top = "<option value='" + idc_contacts[r] + "'>" + idc_contacts[r] + "</option>";
            $("#idc_contact_create").append(top);
            $("#idc_contact_edit").append(top);
        }
        $('#idc_contact_create').selectpicker("refresh");
        $('#idc_contact_edit').selectpicker("refresh");
    }
});


// 请求域用户列表
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
        var users = rows_data.rows;
        for (var r = 0; r < users.length; r++) {
            var top = "<option value='" + users[r].name_mail + "'>" + users[r].name_mail + "</option>";
            // $("#idc_recipient_create").append(top);
            $("#idc_recipient_edit").append(top);
            // $("#idc_maintainer_create").append(top);
            $("#idc_maintainer_edit").append(top);
        }
        // $('#idc_recipient_create').selectpicker("refresh");
        $('#idc_recipient_edit').selectpicker("refresh");
        // $("#idc_maintainer_create").selectpicker("refresh");
        $("#idc_maintainer_edit").selectpicker("refresh");
    }
});

// 请求IDC相关表信息列表
$.ajax({
    type: 'GET',
    url: '/idc_info_index',
    async: true,
    data: {'field': 'show_reference', 'csrf_token': csrf_token},
    success: function (rows_data) {
        if (rows_data.userdata) {
            alert(rows_data.userdata);
            return 0;
        }
        referenced = rows_data.rows;
        var idc_type = rows_data.rows.idc_type;
        var idc_project = rows_data.rows.idc_project;
        var idc_business = rows_data.rows.idc_business;
        var idc_depository = rows_data.rows.idc_depository;
        //fill referenced list
        for (var r = 0; r < idc_type.length; r++) {
            var top = "<option value='" + idc_type[r] + "'>" + idc_type[r] + "</option>";
            $("#idc_type").append(top);
            $("#idc_type_modal").append(top);
            $("#idc_type_edit_modal").append(top);
        }
        for (r = 0; r < idc_project.length; r++) {
            var pop = "<option value='" + idc_project[r] + "'>" + idc_project[r] + "</option>";
            $("#idc_project").append(pop);
            $("#idc_project_modal").append(pop);
            $("#idc_project_edit_modal").append(pop);
        }
        for (r = 0; r < idc_business.length; r++) {
            var bop = "<option value='" + idc_business[r] + "'>" + idc_business[r] + "</option>";
            $("#idc_business").append(bop);
            $("#idc_business_modal").append(bop);
            $("#idc_business_edit_modal").append(bop);
        }

        for (r = 0; r < idc_depository.length; r++) {
            var dop = "<option value='" + idc_depository[r] + "'>" + idc_depository[r] + "</option>";
            $("#idc_depository").append(dop);
            $("#idc_depository_modal").append(dop);
            $("#idc_depository_edit_modal").append(dop);
            $("#idc_depository_create_modal").append(dop);
            $("#mapping_idc_depository_edit_modal").append(dop);
        }
        $("#idc_project_edit_modal").selectpicker("refresh");
        $("#idc_business_edit_modal").selectpicker("refresh");
        $('#idc_project_modal').selectpicker("refresh");
        $('#idc_business_modal').selectpicker("refresh");
    }
});


// IDC信息表格
var idcInfoModel = [
    {field: 'status', checkbox: true},
    {
        field: 'Number', title: '行号', align: 'center', width: 35, formatter: function (value, row, index) {
        return index + 1;
    }
    },
    {title: 'id', field: 'id', visible: false, sortable: true},
    {title: 'version', field: 'version', visible: false},
    {title: '类型', field: 'idc_type', sortable: true, visible: false},
    {title: '品牌型号', field: 'idc_brand_model', sortable: true, visible: false},
    {title: '硬件序列号', field: 'idc_hardware_serial', sortable: true, visible: false},
    {title: '管理地址', field: 'idc_manage_ips', sortable: true, visible: false},
    {title: '物理主机OS主IP', field: 'idc_physical_os_ips', sortable: true, visible: false},
    {title: 'IDC机房', field: 'idc_depository', sortable: true, visible: false},
    {title: '机柜', field: 'idc_cabinet', sortable: true, visible: false},
    {title: '机柜内编号', field: 'idc_in_cabinet', sortable: true, visible: false},
    {title: '主机OS', field: 'idc_os_type', sortable: true, visible: false},
    {title: 'idc_brief', field: 'idc_brief', sortable: true, visible: false},
    {title: '简明配置', field: 'brief', sortable: true, visible: false},
    {title: '项目', field: 'idc_project', sortable: true, visible: false},
    {title: '业务', field: 'idc_business', sortable: true, visible: false},
    {title: 'idc_module', field: 'idc_module', sortable: true, visible: false},
    {title: '模块', field: 'module', sortable: true, visible: false},
    {title: '成本中心', field: 'idc_cost_center', sortable: true, visible: false},
    {title: '领用人', field: 'idc_recipient', sortable: true, visible: false},
    {title: '维护人', field: 'idc_maintainer', sortable: true, visible: false},
    {title: '领用人邮箱', field: 'idc_recipient_mail', sortable: true, visible: false},
    {title: '维护人邮箱', field: 'idc_maintainer_mail', sortable: true, visible: false},
    {title: 'idc_contact', field: 'idc_contact', sortable: true, visible: false},
    {title: '联系人', field: 'contact', sortable: true, visible: false},
    {title: '故障', field: 'idc_malfunction', sortable: true, visible: false},
    {title: 'is_customer', field: 'is_customer', sortable: true, visible: false},
    {title: '客户设备', field: 'IsCustomer', sortable: true, visible: false},
    {title: '网络映射', field: 'network_mapping', index: 'network_mapping', sortable: false, visible: false},
    {title: '创建时间', field: 'create_time', sortable: true, visible: false},
    {title: '刀片编号', field: 'blade', sortable: true, visible: false},
    {title: '备注', field: 'idc_remark', sortable: true, width: "10%", visible: false}];

// 特殊列排序转换
function exchangeFields(field) {
    if (field == 'brief') {
        return 'idc_brief';
    }
    else if (field == 'module') {
        return 'idc_module';
    }
    else if (field == 'IsCustomer') {
        return 'is_customer';
    }
    else if (field == 'contact') {
        return 'idc_contact';
    }
    else if (field == 'idc_cost_center') {
        return 'idc_project';
    }
    else if (field == 'contact') {
        return 'idc_contact';
    }
    else {
        return field
    }
}


// 初始化IDC-Info表格
$('#idcInfoGrid').bootstrapTable({
    columns: idcInfoModel,
    pagination: true,
    sidePagination: 'server',
    idField: 'id',
    uniqueId: 'id',
    paginationVAlign: 'top',
    pageSize: 20,
    pageNumber: 1,
    pageList: [20, 100, 500, 2000],
    striped: true,
    showToggle: true,
    showColumns: true,
    showExport: true,
    exportOptions: {fileName: 'IDC信息'},
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right',
    toolbarAlign: 'left',
    toolbar: "#toolbar",

    queryParams: idcInfoGETQueryParameters,

    ajaxOptions: {
        url: '/idc_info_index',
        method: 'get',
        data: {field: 'show_all', csrf_token: csrf_token}
    },

    ajax: function (request) {
        $.ajax(request);
    },

    responseHandler: idcInfoRespHandler
});


// GET查询参数
function idcInfoGETQueryParameters(params) {

    var _params = getQueryParameters(params, 'idc_hardware_serial', 20, csrf_token);
    // 转换特殊排序字段
    _params.sort = exchangeFields(_params.sort);
    _params.field = 'show_all';
    return _params;
}


// responseHandler
function idcInfoRespHandler(result) {
    var _result = parserResponding(result);
    for (var i = 0; i < _result.rows.length; i++) {
        addMappingButton(_result.rows[i]);
        addManageIPBreak(_result.rows[i]);
        addPhysicIPButton(_result.rows[i]);
        addModuleButton(_result.rows[i]);
        addIdcBriefButton(_result.rows[i]);
        addIsCustomer(_result.rows[i]);
        addContactDetail(_result.rows[i]);
    }
    return _result;
}


// 网络映射表格
var networkMappingModel = [
    {title: 'IDC机房', field: 'idc_depository', sortable: true},
    {title: '域名', field: 'domain', sortable: true},
    {title: '协议', field: 'protocol', sortable: true},
    {title: '外网IP', field: 'extranet_ip', sortable: true},
    {title: '外网端口', field: 'extranet_port', sortable: true},
    {title: '内网IP', field: 'intranet_ip', sortable: true},
    {title: '内网端口', field: 'intranet_port', sortable: true},
    {title: '模块', field: 'module', sortable: true}];


// 创建网络映射表格
$('#networkMappingGrid').bootstrapTable({
    columns: networkMappingModel,
    pagination: true,
    sidePagination: 'client',
    paginationVAlign: 'top',
    pageSize: 5,
    pageNumber: 1,
    pageList: [12, 24],
    striped: true,
    paginationHAlign: 'left',
    paginationDetailHAlign: 'right'
});


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
    if (physical_ips.length != 0) {
        ips = physical_ips.split(',');
        ips_visible = "";
        ips_invisible = "";
        if (ips && ips.length > 0) {
            ips_visible = ips.slice(0, 4).join("<br>");
        }
        if (ips && ips.length > 4) {
            invisible_id = "invisible_ip_" + item.id;

            ips_invisible = ips.slice(4).join("<br>");
            ips_invisible = "<div  hidden id='" + invisible_id + "'>" + ips_invisible + "</div>" + "<br>";
            ips_invisible = ips_invisible + '<a href=javascript:showIps(\"#' + invisible_id + '"\)>更多</a>';
        }
        item.idc_physical_os_ips = ips_visible + ips_invisible;
    }
}


// 查询远程管理卡信息
function indexRemoteManageCard(hardware_serial) {
    var data = {
        "idc_hardware_serial": hardware_serial,
        "csrf_token": csrf_token
    };
    $.ajax({
        type: "POST",
        url: '/remote_manage_card_index',
        async: false,
        data: data,
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                return 0;
            }
            if (rows_data.message) {
                alert(rows_data.message);
            }

            if (rows_data.rows && rows_data.rows[0]) {
                var row = rows_data.rows[0];
                formfiller(row, $("#remoteManageCardIndexModalForm"));
                $("#remoteManageCardIndexModal").modal('show');
            }
        }
    });
}


// 管理IP换行
function addManageIPBreak(item) {
    var manage_ip = item.idc_manage_ips.toString();
    var ips, ips_visible;
    if (manage_ip.length != 0) {
        ips = manage_ip.split(',');
        ips_visible = '<a href=javascript:indexRemoteManageCard(\"' + item.idc_hardware_serial + '"\)>';
        if (ips && ips.length > 0) {
            ips_visible += ips.join("<br>");
        }
        ips_visible += "</a>";
        item.idc_manage_ips = ips_visible;
    }
}


// 查询网络映射
function indexNetworkMapping(id) {
    var item = $("#idcInfoGrid").bootstrapTable('getRowByUniqueId', parseInt(id));

    var ios_ips = item.idc_physical_os_ips;
    var mam_ips = item.idc_manage_ips;

    // 填充ip module列表
    // var modules = item.idc_module;
    // modules = modules.split(",");
    var ips, ips_str;
    if (ios_ips == "") {
        ips = getIps(mam_ips);
        ips_str = ips.join("/");
    }
    else if (mam_ips == "") {
        ips = getIps(ios_ips);
        ips_str = ips.join("/");
    }
    else {
        ips_str = ios_ips + '/' + mam_ips;
        ips = getIps(ips_str);
        ips_str = ips.join("/");
    }
    // var module_create_modal = $("#module_create_modal");
    // var module_edit_modal = $("#module_edit_modal");
    // module_create_modal.empty();
    // module_edit_modal.empty();
    // for (var r = 0; r < modules.length; r++) {
    //     module_create_modal.append("<option value='" + modules[r] + "'>" + modules[r] + "</option>");
    //     module_edit_modal.append("<option value='" + modules[r] + "'>" + modules[r] + "</option>");
    // }
    var intranet_ip_edit_modal = $("#intranet_ip_edit_modal");
    var intranet_ip_create_modal = $("#intranet_ip_create_modal");
    intranet_ip_edit_modal.empty();
    intranet_ip_create_modal.empty();
    for (var r = 0; r < ips.length; r++) {
        intranet_ip_edit_modal.append("<option value='" + ips[r] + "'>" + ips[r] + "</option>");
        intranet_ip_create_modal.append("<option value='" + ips[r] + "'>" + ips[r] + "</option>");
    }

    var data = {"intranet_ip": ips_str, 'csrf_token': csrf_token};
    getDataAndUpdateGrid(
        "#create_button",
        '/network_mapping_index',
        'POST',
        '',
        data,
        "#networkMappingGrid",
        'client',
        ""
    );
    $("#mappingModal").modal('show');
}


// 增加网络映射按钮
function addMappingButton(item) {
    var physical_os_ips = item.idc_physical_os_ips;
    var manage_ip = item.idc_manage_ips;
    if (physical_os_ips.length != 0 || manage_ip.length != 0) {
        item.network_mapping = '<a href=javascript:indexNetworkMapping(\"' + item.id + '"\)>查看</a>';
    }
}


// 查询IDC配置信息
function indexIdcBrief(h_id) {
    var data = {"h_id": h_id, 'r_type': 'string', 'csrf_token': csrf_token};
    $.ajax({
        type: 'POST',
        url: 'server_equipment_index',
        data: data,
        async: true,
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                return 0;
            }
            else {
                $("#serverEquipmentIndexModal").modal('show');
                var tag = $("#server_equipment_index");
                tag.empty();
                tag.append(rows_data);
            }
        }
    });
}


// 增加简明配置按钮
function addIdcBriefButton(item) {
    item.brief = '<a href=javascript:indexIdcBrief("' + item.idc_hardware_serial + '")>' + item.idc_brief + '</a>';
}


// 增加客户设备字段
function addIsCustomer(item) {
    if (item.is_customer == 'false' || item.is_customer == false) {
        item.IsCustomer = '否';
    }
    else {
        item.IsCustomer = '是';
    }
}


// 查询IDC信息联系人
function indexContact(idc_contact) {
    $.ajax({
        type: 'POST',
        url: '/idc_info_contact_re_index',
        async: true,
        data: {'idc_contact': idc_contact, 'csrf_token': csrf_token},
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                return 0;
            }
            if (rows_data.rows && rows_data.rows[0]) {
                var row = rows_data.rows[0];
                formfiller(row, $("#contactIndexModalForm"));
                $("#contactIndexModal").modal('show');
            }

        }
    });
}


// 增加联系人详情查询
function addContactDetail(item) {
    item.contact = '<a href=javascript:indexContact("' + item.idc_contact + '")>' + item.idc_contact + '</a>';
}


// 获取搜索表单数据
function get_table_data() {
    var selects = $("#index_tbody tr td select");
    var inputs = $("#index_tbody tr td input");
    var result = [];

    for (var i = 0, j = 0; i < selects.length; i++) {
        if (i % 3 == 1) {
            result.push({'name': 'fields', 'value': selects[i].value});
        }
        if (i % 3 == 2) {
            result.push({'name': 'functions', 'value': selects[i].value});
        }
        if (i % 3 == 0) {
            result.push({'name': 'andors', 'value': selects[i].value});
        }
        if ((i + 1) % 3 == 0) {
            result.push({'name': 'values', 'value': inputs[j].value});
            j++;
        }
    }
    return result;
}


// 增加搜索条件
$("tbody button[id='add_index']").click(function () {
    // copy and append node
    var node = $("tbody").children("tr").last().clone(true);
    $(this).parent().parent().parent().parent().append(node);
});


// 移除当前搜索条件
$("tbody button[id='remove_index']").click(function () {
    if ($("#index_tbody").find("tr").length > 1) {
        $(this).parent().parent().parent().remove();
    }
    // disable the first select tag
    $("td").children("select").first().attr('style', 'display: none');
});


// 创建IDC信息
$("#create_button").click(function () {
    getDataAndUpdateGrid("#create_button", '/idc_info_create', 'POST', '#create_form', '', "#idcInfoGrid", 'server', "");
    $('#idc_project_modal').selectpicker("refresh");
    $('#idc_business_modal').selectpicker("refresh");
    $('#idc_contact_create').selectpicker("refresh");
});


function indexIdc(data_){
    var _data;
    if (data_){
        _data = [];
    }
    else{
        _data = get_table_data();
    }

    // 处于备机池状态
    console.log($("#idc_scope").val());
    if ($("#idc_scope").val() == 'off'){
        _data.push({'name': 'andors', 'value': '&&'});
        _data.push({'name': 'fields', 'value': 'idc_project'});
        _data.push({'name': 'functions', 'value': '=='});
        _data.push({'name': 'values', 'value': '运维备机'});
    }
    _data.push({'name': 'csrf_token', 'value': csrf_token});

    $('#idcInfoGrid').bootstrapTable('refreshOptions', {
        queryParams: function (params) {
            var para = idcInfoGETQueryParameters(params);
            var data = jQuery.extend(true, [], _data);
            // 加入分页 排序参数
            console.log(para.offset);
            data.push({'name': 'limit', 'value': para.limit});
            data.push({'name': 'offset', 'value': para.offset});
            data.push({'name': 'sort', 'value': para.sort});
            data.push({'name': 'order', 'value': para.order});

            return data;
        },

        ajaxOptions: {
            url: '/idc_info_index',
            method: 'post',
            data: _data
        }
    });
    hideSpecialItem(hiddenFields);
}


// POST查询idc信息
$("#index_button").click(function () {
    // 解析查询表单的数据
    indexIdc(false);
});


// 编辑IDC信息
$("#edit_button").click(function () {
    var item = getSelected('#idcInfoGrid', true, false);
    if (item === null) {
        return null;
    }

    item = item[0];
    var physical_os_ips = getIps(item.idc_physical_os_ips);
    var manage_ips = getIps(item.idc_manage_ips);
    if (physical_os_ips == null) {
        item.idc_physical_os_ips = '';
    } else {
        item.idc_physical_os_ips = physical_os_ips.join("\n");
    }
    if (manage_ips == null) {
        item.idc_manage_ips = '';
    } else {
        item.idc_manage_ips = manage_ips.join("\n");
    }
    //恢复模块 简明配置信息为原始数据
    item.module = item.idc_module;
    item.brief = item.idc_brief;
    //处理领用人 维护人
    var recipient = item.idc_recipient;
    var maintainer = item.idc_maintainer;
    item.idc_recipient = recipient + ':' + item.idc_recipient_mail;
    item.idc_maintainer = maintainer + ':' + item.idc_maintainer_mail;

    formfiller(item, $("#documentModal"));
    $("#documentModal").modal('show');
    // 设置默认值
    $('#idc_recipient_edit').selectpicker('val', item.idc_recipient);
    $("#idc_maintainer_edit").selectpicker('val', item.idc_maintainer);
    $('#idc_project_edit_modal').selectpicker('val', item.idc_project);
    $('#idc_business_edit_modal').selectpicker('val', item.idc_business);
    $('#idc_contact_edit').selectpicker('val', item.idc_contact);
    item.idc_recipient = recipient;
    item.idc_maintainer = maintainer;
});


// 保存编辑
$("#save_confirm").click(function () {
    var data = $("#detail_form").serializeArray();
    // 去掉域用户名后面的用户名
    for (var i = 0; i < data.length; i++) {
        if (data[i].name == "idc_recipient" || data[i].name == "idc_maintainer" || data[i].name == "idc_contact") {
            data[i].value = data[i].value.replace(/\s+/g, "");
            if (data[i].value.indexOf("(") != -1) {
                data[i].value = data[i].value.split("(")[0];
            }
        }
        else if (data[i].name == "idc_physical_os_ips") {
            var ips = getIps(data[i].value);
            if (ips != null) {
                data[i].value = ips.join('/');
            }
        }
        else {
        }
    }
    getDataAndUpdateGrid("#save_confirm", '/idc_info_edit', 'POST', '#detail_form', data, "#idcInfoGrid", 'server', "#documentModal");
});


// 删除IDC信息
$("#delete_button").confirm({
    title: "删除IDC信息",
    text: "确定是否删除该IDC信息?",
    confirm: function () {
        deleteSelectedItems("#delete_button", "#idcInfoGrid", '/idc_info_delete', true);
    },
    confirmButton: "删除",
    cancelButton: "取消"
});


// 编辑远程管理卡配置信息
$("#serverEquipmentBtn").click(function () {
    var data = $('#serverEquipmentForm').serializeArray();
    showMessage('#serverEquipmentBtn', '/server_equipment_remark', 'POST', data);
    $("#serverEquipmentIndexModal").modal('hide');
});


// 进入重装系统
// 若存在Cobbler System 则进入编辑页面
// 不存在Cobbler System 则进入创建页面
$("#reinstall_button").click(function () {
    var item = getSelected("#idcInfoGrid", true, false);

    // 未获取到profile 退出
    if (!getProfiles()) {
        return 0;
    }

    var name = item[0].idc_hardware_serial;
    $.ajax({
        type: 'POST',
        url: 'cobbler_system_detail',
        async: false,
        data: {'name': name, 'csrf_token': csrf_token},
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                return 0;
            }
            // 存在数据 编辑
            if (rows_data.row && JSON.stringify(rows_data.row) != "{}") {
                formfiller(rows_data.row, $("#reinstallEditForm"));
                $("#reinstallEditModal").modal('show');
            }
            // 不存在 创建
            else {
                createCobblerWithName(name);
            }
        }
    });
});


// 创建Cobbler信息
// 请求该设备硬件配置信息
// 请求成功则用配置信息填充创建模板
function createCobblerWithName(name) {
    var data = {"h_id": name, 'r_type': 'dict', 'csrf_token': csrf_token};
    $.ajax({
        type: 'POST',
        url: 'server_equipment_index',
        data: data,
        async: true,
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                return 0;
            }
            if (rows_data.row) {
                formfiller(rows_data.row, $("#reinstallCreateForm"));
                $("#reinstallCreateModal").modal('show');
            }
        }
    });
}


// 创建Cobbler保存
$("#reinstallCreateSave").click(function () {
    getDataAndUpdateGrid(
        "#reinstallCreateSave",
        '/cobbler_system_create',
        'POST',
        '#reinstallCreateForm',
        '',
        "",
        'server',
        "#reinstallCreateModal"
    );
});


// 编辑Cobbler保存
$("#reinstallEditSave").click(function () {
    getDataAndUpdateGrid(
        "#reinstallEditSave",
        '/cobbler_system_edit',
        'POST',
        '#reinstallEditForm',
        '',
        "",
        'server',
        "#reinstallEditModal"
    );
});


// 开始重装系统
$("#reinstallSystem").click(function () {
    $.ajax({
        type: 'POST',
        url: 'system_reinstall',
        data: $('#reinstallEditForm').serializeArray(),
        async: true,
        success: function (rows_data) {
            if (rows_data.userdata) {
                alert(rows_data.userdata);
                $("#delete_reinstall").removeAttr('disabled');
                return 0;
            }
            if (rows_data.message) {
                alert(rows_data.message);
            }
            //enable index button
            $("#delete_reinstall").removeAttr('disabled');
        }
    });
});


// 保存IDC信息表格列
$("#save_field").click(function () {
    save_grids("#idcInfoGrid", 'lines');
});


// 保存备机表格列
$("#save_spare_grid").click(function () {
    save_grids("#idcInfoGrid", 'spare_lines');
});


// 载入列
function loadFields() {
    var lis = $('#showLines').find('li');
    for (var i = 0; i < lis.length; i++) {
        $("#idcInfoGrid").bootstrapTable('showColumn', lis[i].textContent);
    }
}


var hiddenFields = ['status', 'id', 'version', 'idc_brief', 'idc_module', 'idc_recipient_mail', 'idc_maintainer_mail',
    'idc_contact', 'is_customer', 'create_time'];
$(document).ready(function () {
    // 表格高度适应
    var top = $('#idcInfoGrid').offset().top;
    adjustSize("#idcInfoGrid", top, 30);

    $(window).resize(function () {
        adjustSize("#idcInfoGrid", top, 30);
        hideSpecialItem(hiddenFields);
    });

    loadFields();

    // 隐藏特殊列
    hideSpecialItem(hiddenFields);
});


// 监听搜索回车事件
$("#field_container").bind("keydown", function (e) {
    var theEvent = e || window.event;
    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
    if (code == 13) {
        //回车执行编辑
        $("#index_button").click();
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


// idc 搜索范围
$("#idc_scope").bootstrapSwitch({
    'size': '',
    'onText': "所有IDC",
    'offText': '备机池',
    'onColor': 'info',
    'offColor': 'primary',
    onSwitchChange:function(event,state){
        // 所有idc
        if(state==true){
            $('#idcInfoGrid').bootstrapTable('refreshOptions', {
                queryParams: idcInfoGETQueryParameters,

                ajaxOptions: {
                    url: '/idc_info_index',
                    method: 'get',
                    data: {field: 'show_all', csrf_token: csrf_token}
                }
            });
            $(this).val('on');
        }
        // 备机idc
        else{
            $(this).val('off');
            indexIdc(true);
        }
        hideSpecialItem(hiddenFields);
    }
});


// 编辑系统密码
$("#spareEdit").click(function () {
    var item = getSelected('#idcInfoGrid', true, false);
    if (item === null) {
        return null;
    }

    $("#spareEdit").attr('disabled', 'disabled');
    $.ajax({
        type: 'GET',
        url: '/spare_idc_index',
        async: true,
        data: {'types': 'edit', 'csrf_token': csrf_token, 'idc_hardware_serial': item[0].idc_hardware_serial},
        success: function (rows_data) {
            $("#spareEdit").removeAttr('disabled');
            if (rows_data.userdata){
                alert(rows_data.userdata);
                return;
            }
            if (rows_data.row){
                formfiller(rows_data.row, $("#system_password_form"));
                $("#systemPwdModal").modal('show');
            }
    }});

});


// 保存备机系统密码
$("#system_psw_save").click(function () {
    $("#system_psw_save").attr('disabled', 'disabled');
    var _data = $('#system_password_form').serializeArray();
    $.ajax({
        type: 'POST',
        url: '/spare_idc_edit',
        async: true,
        data: _data,
        success: function (rows_data) {
            $("#system_psw_save").removeAttr('disabled');
            if (rows_data.userdata){
                alert(rows_data.userdata);
                return;
            }
            if (rows_data.message){
                alert(rows_data.message);
                $("#systemPwdModal").modal('hide');
            }
    }});
});