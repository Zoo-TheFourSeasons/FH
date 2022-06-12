$.ajaxSetup({
    cache: false
});


$("li a").click(function () {

    var tagName = $(this).attr('name');
    if (tagName !== undefined){

        $("#content-wrapper-item").load(tagName, null, function () {
            var jsFile = '';
            switch (tagName){
                case 'info_index': jsFile = '/static/cmdb-js/info.js';break;
                case 'idc_info_index': jsFile = '/static/cmdb-js/idc/idc_info.js';break;
                case 'spare_idc_index': jsFile = '/static/cmdb-js/idc/spare_idc.js';break;
                case 'idc_info_contact_index': jsFile = '/static/cmdb-js/idc/idc_info_contact.js';break;
                case 'idc_type_index': jsFile = '/static/cmdb-js/idc/idc_type.js';break;
                case 'idc_depository_index': jsFile = '/static/cmdb-js/idc/idc_depository.js';break;
                case 'idc_project_index': jsFile = '/static/cmdb-js/idc/idc_project.js';break;
                case 'idc_business_index': jsFile = '/static/cmdb-js/idc/idc_business.js';break;
                case 'idc_cost_center_index': jsFile = '/static/cmdb-js/idc/idc_cost_center.js';break;
                case 'remote_manage_card_index': jsFile = '/static/cmdb-js/idc/remote_manage_card.js';break;
                case 'network_mapping_index': jsFile = '/static/cmdb-js/network/network_mapping.js';break;
                case 'network_isp_index': jsFile = '/static/cmdb-js/network/network_isp.js';break;
                case 'network_lan_index': jsFile = '/static/cmdb-js/network/network_lan.js';break;
                case 'network_domain_index': jsFile = '/static/cmdb-js/network/network_domain.js';break;
                case 'cobbler_system_index': jsFile = '/static/cmdb-js/network/system_reinstall.js';break;
                case 'permissions_index': jsFile = '/static/cmdb-js/permission/permissions.js';break;
                case 'roles_index': jsFile = '/static/cmdb-js/permission/roles.js';break;
                case 'feedback_index': jsFile = '/static/cmdb-js/feedback.js';break;
            }
            jQuery.getScript(jsFile);
        });
    }
});


$.fn.bootstrapSwitch.defaults.size = 'mini';
$.fn.bootstrapSwitch.defaults.onColor = 'danger';
$.fn.bootstrapSwitch.defaults.offColor = 'warning';


$("li a[name='idc_info_index']").click();


$(".dropdown-toggle").click(function () {

    var $item = $(this).parent();
    if (!$item.hasClass('open')) {
        $item.parent().find('.open .submenu').slideUp('fast');
        $item.parent().find('.open').toggleClass('open');
    }
    $item.toggleClass('open');
    if ($item.hasClass('open')) {
        $item.children('.submenu').slideDown('fast');
    }
    else {
        $item.children('.submenu').slideUp('fast');
    }
});
