let ModelLP = {
    'model': {
        'id': 'arrowMapSettingModal',
        'url': '',
    },
    'show': function () {
        $("#" + this.model.id).modal('show');
    },
    'hide': function () {
        $("#" + this.model.id).modal('hide');
    },
    'fresh': function (data) {
        let i;
        let field;
        let fields = $("#" + this.model.id + ' .f-data');

        console.log('fresh', data);
        for (i = 0; i < fields.length; i++) {
            field = fields[i];
            if (field.name === undefined) {
                continue
            }

            if (data[field.name] === undefined) {
                continue
            }
            console.log(field.name);
            this.fill_one(field, data[field.name]);
        }
    },
    'fill_one': function (field, value) {
        let local_name = field.localName;
        if (local_name === 'input') {
            $(field).val(value);
        } else if (local_name === 'span') {
            $(field)[0].textContent = value;
        } else if (local_name === 'select') {
            $(field).each(function () {
                let that = this;
                if ($(that).hasClass('selectpicker')) {
                    // bootstrap-select
                    $(that).selectpicker('val', value)
                } else {
                    // normal select
                    alert('normal select. ');
                }
            });
        } else if (local_name === 'textarea') {
            $(field).val(value);
        }
    },
    'request': function (params) {
        let that = this;
        if (params.data === undefined) {
            params.data = $("#" + this.model.id + ' form').serialize();
        }

        if (params.url === undefined) {
            params.url = this.model.url;
        }

        if (params.after !== undefined) {
            let f = params.after;
            // 已定义成功回调
            // 添加模态框收起
            function ffff(rsp, p) {
                if (that.model.id !== '') {
                    $('#' + that.model.id).modal('hide');
                    let table = $('#' + that.model.id + ' table');
                    if (table.length > 0) {
                        table.bootstrapTable('refresh');
                    }
                }
                f(rsp, p);
            }

            params.after = ffff;
        } else {
            let f = params.success;

            if (params.success === undefined) {
                // 未定义成功回调
                function ff() {
                    $('#' + that.model.id).modal('hide');
                    let table = $('#' + that.model.id + ' table');
                    if (table.length > 0) {
                        table[0].bootstrapTable('refresh');
                    }
                }

                params.success = ff;
            } else {
                // 已定义成功回调
                // 添加模态框收起
                function fff(rsp, p) {
                    if (that.model.id !== '') {
                        $('#' + that.model.id).modal('hide');
                        let table = $('#' + that.model.id + ' table');
                        if (table.length > 0) {
                            table.bootstrapTable('refresh');
                        }
                    }
                    f(rsp, p);
                }

                params.success = fff;
            }
        }

        console.log('post', params);
        if (params.m === 'post') {
            post(params);
        } else {
            get(params)
        }
    },
    'get': function (params) {
        params.m = 'get';
        this.request(params)
    },
    'post': function (params) {
        params.m = 'post';
        this.request(params)
    },
    'json': function () {
        let json = {};
        let fields = $("#" + this.model.id + ' .f-data');
        let i, field, name;

        for (i = 0; i < fields.length; i++) {
            field = fields[i];
            name = field.name;

            let local_name = field.localName;
            let value;
            if (local_name === 'input') {
                value = $(field).val();
            } else if (local_name === 'span') {
                value = $(field)[0].textContent;
            } else if (local_name === 'select') {
                $(field).each(function () {
                    let that = this;
                    if ($(that).hasClass('selectpicker')) {
                        // todo: 可能会有问题
                        value = $(that).selectpicker('val');
                    } else {
                        // normal select
                        alert('normal select. ');
                    }
                });
            } else if (local_name === 'textarea') {
                value = $(field).val();
            }
            if (json[name] === undefined) {
                json[name] = value;
            } else {
                if (json[name] instanceof Array) {
                    json[name].push(value);
                } else {
                    let tmp = json[name];
                    json[name] = [tmp, value]
                }
            }
        }
        console.log('json', json);
        return json;
    }
};


// ******************************************************************系统用户
// 登录
let login_model = {
    'id': 'login-model',
    'url': '/'
};
let Login = Object.create(ModelLP);
Login.model = login_model;

// 注册
let register_model = {
    'id': 'register-model',
    'url': '/rf/system_user/register'
};
let Register = Object.create(ModelLP);
Register.model = register_model;

// 添加
let system_user_add_model = {
    'id': 'system-user-add-modal',
    'url': '/rf/system_user/system_user_add'
};
let SystemUserAdd = Object.create(ModelLP);
SystemUserAdd.model = system_user_add_model;

// 编辑
let system_user_edit_model = {
    'id': 'system-user-edit-modal',
    'url': '/rf/system_user/system_user_edit'
};
let SystemUserEdit = Object.create(ModelLP);
SystemUserEdit.model = system_user_edit_model;

// 删除
let system_user_delete_model = {
    'id': '',
    'url': '/rf/system_user/system_user_delete'
};
let SystemUserDelete = Object.create(ModelLP);
SystemUserDelete.model = system_user_delete_model;

// 启用
let system_user_enable_model = {
    'id': '',
    'url': '/rf/system_user/system_user_enable'
};
let SystemUserEnable = Object.create(ModelLP);
SystemUserEnable.model = system_user_enable_model;

// 禁用
let system_user_disable_model = {
    'id': '',
    'url': '/rf/system_user/system_user_disable'
};
let SystemUserDisable = Object.create(ModelLP);
SystemUserDisable.model = system_user_disable_model;


// 索引
let system_user_index_model = {
    'id': '',
    'url': '/rf/system_user/data'
};
let SystemUserIndex = Object.create(ModelLP);
SystemUserIndex.model = system_user_index_model;


// ******************************************************************自治用户
// 添加
let autonomy_user_add_model = {
    'id': 'autonomy-user-add-modal',
    'url': '/rf/autonomy_user/autonomy_user_add'
};
let AutonomyUserAdd = Object.create(ModelLP);
AutonomyUserAdd.model = autonomy_user_add_model;

// 同步
let autonomy_user_sync_model = {
    'id': 'autonomy-user-sync-modal',
    'url': '/rf/autonomy_user/autonomy_user_sync'
};
let AutonomyUserSync = Object.create(ModelLP);
AutonomyUserSync.model = autonomy_user_sync_model;

// 启用
let autonomy_user_enable_model = {
    'id': '',
    'url': '/rf/autonomy_user/autonomy_user_enable'
};
let AutonomyUserEnable = Object.create(ModelLP);
AutonomyUserEnable.model = autonomy_user_enable_model;

// 禁用
let autonomy_user_disable_model = {
    'id': '',
    'url': '/rf/autonomy_user/autonomy_user_disable'
};
let AutonomyUserDisable = Object.create(ModelLP);
AutonomyUserDisable.model = autonomy_user_disable_model;

// 删除
let autonomy_user_delete_model = {
    'id': '',
    'url': '/rf/autonomy_user/autonomy_user_delete'
};
let AutonomyUserDelete = Object.create(ModelLP);
AutonomyUserDelete.model = autonomy_user_delete_model;


// *******************************************************************自治
// 自治服务器系统管理
let autonomy_system_config_model = {
    'id': '',
    'url': '/rf/autonomy_server_admin/autonomy_system_config_manage'
};
let AutonomySysConfig = Object.create(ModelLP);
AutonomySysConfig.model = autonomy_system_config_model;

// 添加
let autonomy_add_model = {
    'id': 'autonomy-add-modal',
    'url': '/rf/autonomy_server_admin/autonomy_add'
};
let AutonomyServerAdd = Object.create(ModelLP);
AutonomyServerAdd.model = autonomy_add_model;

// 编辑
let autonomy_edit_model = {
    'id': 'autonomy-edit-modal',
    'url': '/rf/autonomy_server_admin/autonomy_edit'
};
let AutonomyServerEdit = Object.create(ModelLP);
AutonomyServerEdit.model = autonomy_edit_model;

// 编辑
let autonomy_delete_model = {
    'id': '',
    'url': '/rf/autonomy_server_admin/autonomy_delete'
};
let AutonomyServerDelete = Object.create(ModelLP);
AutonomyServerDelete.model = autonomy_delete_model;

// 自治设备导入
let autonomy_device_upload_model = {
    'id': 'device-upload-modal',
    'url': '/rf/autonomy_server_admin/devices_upload'
};
let AutonomyDeviceUpload = Object.create(ModelLP);
AutonomyDeviceUpload.model = autonomy_device_upload_model;

// 自治设备卸载
let autonomy_device_remove_model = {
    'id': 'device-remove-modal',
    'url': '/rf/autonomy_server_admin/devices_remove'
};
let AutonomyDeviceRemove = Object.create(ModelLP);
AutonomyDeviceRemove.model = autonomy_device_remove_model;

// 自治配置导入
let autonomy_config_upload_model = {
    'id': 'autonomy-config-upload-modal',
    'url': '/rf/autonomy_server_admin/autonomy_config_upload'
};
let AutonomyConfigUpload = Object.create(ModelLP);
AutonomyConfigUpload.model = autonomy_config_upload_model;

// 随机设备
let device_random_model = {
    'id': '',
    'url': '/rf/autonomy_server_admin/device_random'
};
let DeviceRandom = Object.create(ModelLP);
DeviceRandom.model = device_random_model;

// 索引
let autonomy_index_model = {
    'id': '',
    'url': '/rf/autonomy_server_admin/data'
};
let AutonomyIndex = Object.create(ModelLP);
AutonomyIndex.model = autonomy_index_model;

// ******************************************************************设备管理
// 添加
let device_add_model = {
    'id': 'device-add-modal',
    'url': '/rf/autonomy_device_admin/autonomy_device_add'
};
let AutonomyDeviceAdd = Object.create(ModelLP);
AutonomyDeviceAdd.model = device_add_model;

//设备管理
let autonomy_device_disable_model = {
    'id': '',
    'url': '/rf/autonomy_device_admin/manage'
};
let AutonomyDeviceManage = Object.create(ModelLP);
AutonomyDeviceManage.model = autonomy_device_disable_model;

//设备同步
let device_synchronization_model = {
    'id': '',
    'url': '/rf/autonomy_device_admin/synchronization'
};
let FileManage = Object.create(ModelLP);
FileManage.model = device_synchronization_model;

// *********************************************************************会议
// 添加
let meeting_add_model = {
    'id': 'meeting-add-modal',
    'url': '/rf/meeting/meeting_add'
};
let MeetingAdd = Object.create(ModelLP);
MeetingAdd.model = meeting_add_model;

// 添加并上传
let meeting_add_and_upload_model = {
    'id': 'meeting-add-modal',
    'url': '/rf/meeting/meeting_add_and_upload'
};
let MeetingAddAndUpload = Object.create(ModelLP);
MeetingAddAndUpload.model = meeting_add_and_upload_model;

// 添加并上传开始
let meeting_add_and_upload_start_model = {
    'id': 'meeting-add-modal',
    'url': '/rf/meeting/meeting_add_and_upload_start'
};
let MeetingAddAndUploadStart = Object.create(ModelLP);
MeetingAddAndUploadStart.model = meeting_add_and_upload_start_model;

// 编辑
let meeting_edit_model = {
    'id': 'meeting-edit-modal',
    'url': '/rf/meeting/meeting_edit'
};
let MeetingEdit = Object.create(ModelLP);
MeetingEdit.model = meeting_edit_model;


// 成员
let meeting_participants_model = {
    'id': '',
    'url': '/rf/meeting/meeting_participants'
};
let MeetingParticipants = Object.create(ModelLP);
MeetingParticipants.model = meeting_participants_model;


// 获取
let meeting_get_model = {
    'id': 'meeting-get-modal',
    'url': '/rf/meeting/meeting_get'
};
let MeetingGet = Object.create(ModelLP);
MeetingGet.model = meeting_get_model;

// 删除
let meeting_delete_model = {
    'id': '',
    'url': '/rf/meeting/meeting_delete'
};
let MeetingDelete = Object.create(ModelLP);
MeetingDelete.model = meeting_delete_model;

// 上传
let meeting_upload_model = {
    'id': '',
    'url': '/rf/meeting/meeting_upload'
};
let MeetingUpload = Object.create(ModelLP);
MeetingUpload.model = meeting_upload_model;

// 开始
let meeting_start_model = {
    'id': '',
    'url': '/rf/meeting/meeting_start'
};
let MeetingStart = Object.create(ModelLP);
MeetingStart.model = meeting_start_model;

// 结束
let meeting_stop_model = {
    'id': '',
    'url': '/rf/meeting/meeting_stop'
};
let MeetingStop = Object.create(ModelLP);
MeetingStop.model = meeting_stop_model;

// 接管
let meeting_takeover_model = {
    'id': '',
    'url': '/rf/meeting/meeting_takeover'
};
let MeetingTakeover = Object.create(ModelLP);
MeetingTakeover.model = meeting_takeover_model;

// 发言方编辑
let speaker_edit_model = {
    'id': 'speaker-edit-modal',
    'url': '/rf/meeting/speaker_edit'
};
let SpeakerEdit = Object.create(ModelLP);
SpeakerEdit.model = speaker_edit_model;

// 轮询编辑
let polling_edit_model = {
    'id': 'polling-edit-modal',
    'url': '/rf/meeting/polling_edit'
};
let PollingEdit = Object.create(ModelLP);
PollingEdit.model = polling_edit_model;

// 轮询开始
let polling_start_model = {
    'id': '',
    'url': '/rf/meeting/polling_start'
};
let PollingStart = Object.create(ModelLP);
PollingStart.model = polling_start_model;

// 轮询结束
let polling_stop_model = {
    'id': '',
    'url': '/rf/meeting/polling_stop'
};
let PollingStop = Object.create(ModelLP);
PollingStop.model = polling_stop_model;

// 轮询暂停
let polling_pause_model = {
    'id': '',
    'url': '/rf/meeting/polling_pause'
};
let PollingPause = Object.create(ModelLP);
PollingPause.model = polling_pause_model;


// *********************************************************************接口
// 新增
let interface_add_model = {
    'id': 'interface-add-modal',
    'url': '/rf/interfaces/interface_add'
};
let InterfaceAdd = Object.create(ModelLP);
InterfaceAdd.model = interface_add_model;

// 编辑
let interface_edit_model = {
    'id': 'interface-edit-modal',
    'url': '/rf/interfaces/interface_edit'
};

let InterfaceEdit = Object.create(ModelLP);
InterfaceEdit.model = interface_edit_model;

// 删除
let interface_delete_model = {
    'id': '',
    'url': '/rf/interfaces/interface_delete'
};
let InterfaceDelete = Object.create(ModelLP);
InterfaceDelete.model = interface_delete_model;


// 导出
let interface_export_model = {
    'id': '',
    'url': '/rf/interfaces/interface_export'
};
let InterfaceExport = Object.create(ModelLP);
InterfaceExport.model = interface_export_model;


// 导入
let interface_upload_model = {
    'id': 'interface-upload-modal',
    'url': '/rf/interfaces/interface_upload'
};
let InterfaceUpload = Object.create(ModelLP);
InterfaceUpload.model = interface_upload_model;

// 接口用例
let cases_of_interface_modal = {
    'id': '',
    'url': '/rf/interfaces/cases_of_interface/'
};
let InterfaceCase = Object.create(ModelLP);
InterfaceCase.model = cases_of_interface_modal;


// ******************************************************************测试任务
// 定时
let timing_add_model = {
    'id': 'schedule-subscribe-modal',
    'url': '/rf/timing/timing_add'
};
let ScheduleSubscribe = Object.create(ModelLP);
ScheduleSubscribe.model = timing_add_model;

// 新增
let schedule_add_model = {
    'id': 'test-schedule-add-modal',
    'url': '/rf/test_schedule/schedule_add'
};
let ScheduleAdd = Object.create(ModelLP);
ScheduleAdd.model = schedule_add_model;

// 编辑
let schedule_edit_model = {
    'id': 'test-schedule-edit-modal',
    'url': '/rf/test_schedule/schedule_edit'
};
let ScheduleEdit = Object.create(ModelLP);
ScheduleEdit.model = schedule_edit_model;

// 删除
let schedule_delete_model = {
    'id': '',
    'url': '/rf/test_schedule/schedule_delete'
};
let ScheduleDelete = Object.create(ModelLP);
ScheduleDelete.model = schedule_delete_model;

// 上传
let schedule_upload_model = {
    'id': 'schedule-upload-modal',
    'url': '/rf/test_schedule/upload'
};
let ScheduleUpload = Object.create(ModelLP);
ScheduleUpload.model = schedule_upload_model;


// 开始
let schedule_start_model = {
    'id': '',
    'url': '/rf/test_schedule/schedule_start'
};
let ScheduleStart = Object.create(ModelLP);
ScheduleStart.model = schedule_start_model;


// 结束
let schedule_stop_model = {
    'id': '',
    'url': '/rf/test_schedule/schedule_stop'
};
let ScheduleStop = Object.create(ModelLP);
ScheduleStop.model = schedule_stop_model;


// 暂停
let schedule_pause_model = {
    'id': '',
    'url': '/rf/test_schedule/schedule_pause'
};
let SchedulePause = Object.create(ModelLP);
SchedulePause.model = schedule_pause_model;


// 恢复
let schedule_resume_model = {
    'id': '',
    'url': '/rf/test_schedule/schedule_resume'
};
let ScheduleResume = Object.create(ModelLP);
ScheduleResume.model = schedule_resume_model;


// 报告记录
let schedule_reports_model = {
    'id': '',
    'url': '/rf/test_schedule/reports'
};
let ScheduleReports = Object.create(ModelLP);
ScheduleReports.model = schedule_reports_model;


// ******************************************************************用例
// 新增
let case_add_model = {
    'id': 'case-base-add-modal',
    'url': '/rf/test_case/case_add'
};
let CaseAdd = Object.create(ModelLP);
CaseAdd.model = case_add_model;


// 编辑(模态框)
let case_edit_modal = {
    'id': 'test-case-edit-modal',
    'url': '/rf/test_case/case_edit'
};
let CaseEditModal = Object.create(ModelLP);
CaseEditModal.model = case_edit_modal;


// 编辑(新页面)
let case_edit_new_page = {
    'id': 'test-case-edit-modal',
    'url': '/rf/test_case/case_edit_in_new_page'
};
let CaseEditInNewPage = Object.create(ModelLP);
CaseEditInNewPage.model = case_edit_new_page;

// 删除
let case_delete_model = {
    'id': '',
    'url': '/rf/test_case/case_delete'
};
let CaseDelete = Object.create(ModelLP);
CaseDelete.model = case_delete_model;

// 启用
let case_exe_modal = {
    'id': '',
    'url': '/rf/test_case/exe/'
};
let CaseExe = Object.create(ModelLP);
CaseExe.model = case_exe_modal;

// 禁用
let case_ban_modal = {
    'id': '',
    'url': '/rf/test_case/ban/'
};
let CaseBan = Object.create(ModelLP);
CaseBan.model = case_ban_modal;

// 解锁
let case_unlock_modal = {
    'id': '',
    'url': '/rf/test_case/unlock/'
};
let CaseUnlock = Object.create(ModelLP);
CaseUnlock.model = case_unlock_modal;

// 锁定
let case_lock_modal = {
    'id': '',
    'url': '/rf/test_case/lock/'
};
let CaseLock = Object.create(ModelLP);
CaseLock.model = case_lock_modal;

// 拖拽
let case_drag_modal = {
    'id': '',
    'url': '/rf/test_case/drag/'
};
let CaseDrag = Object.create(ModelLP);
CaseDrag.model = case_drag_modal;


// ********************************************************************自治分配
// 添加
let allocate_add_model = {
    'id': 'allocate-add-modal',
    'url': '/rf/autonomy_allocate/allocate_add'
};
let AllocateAdd = Object.create(ModelLP);
AllocateAdd.model = allocate_add_model;


// 编辑
let allocate_edit_model = {
    'id': 'allocate-edit-modal',
    'url': '/rf/autonomy_allocate/allocate_edit'
};
let AllocateEdit = Object.create(ModelLP);
AllocateEdit.model = allocate_edit_model;


// 删除
let allocate_delete_model = {
    'id': '',
    'url': '/rf/autonomy_allocate/allocate_delete'
};
let AllocateDelete = Object.create(ModelLP);
AllocateDelete.model = allocate_delete_model;

// // 未添加用户
// let allocate_get_not_added_model = {
//     'id': '',
//     'url': '/rf/autonomy_allocate/get_not_added'
// };
// let AllocateGetNotAdded = Object.create(ModelLP);
// AllocateGetNotAdded.model = allocate_get_not_added_model;


//**********************************************************************网管信息设置
// 网管信息设置
let network_manage_info_set = {
    'id': 'network_set_modal',
    'url': '/rf/info_inquiry/network_manage_set'
};
let NetworkManageSet = Object.create(ModelLP);
NetworkManageSet.model = network_manage_info_set;

// 日志信息查询
let log_event_info_inquiry = {
    'id': 'log_event_inquiry_modal',
    'url': '/rf/info_inquiry/event_log'
};
let LogEventInquiry = Object.create(ModelLP);
LogEventInquiry.model = log_event_info_inquiry;

// 日志信息删除
let log_event_info_del = {
    'id': '',
    'url': '/rf/info_inquiry/event_log_del'
};
let LogEventDel = Object.create(ModelLP);
LogEventDel.model = log_event_info_del;


// **********************************************************************透传
// 发布直播新增模型
let live_broadcast_add = {
    'id': 'live-broadcast-add-modal',
    'url': '/rf/trans/add_live_broadcast'
};
let LiveBroadCastAdd = Object.create(ModelLP);
LiveBroadCastAdd.model = live_broadcast_add;


// 收看直播新增模型
let watch_live_broadcast_add = {
    'id': 'watch-live-broadcast-add-modal',
    'url': '/rf/trans/add_watch_live_broadcast'
};
let WatchLiveBroadCastAdd = Object.create(ModelLP);
WatchLiveBroadCastAdd.model = watch_live_broadcast_add;


// 可视电话新增模型
let video_telephone_add = {
    'id': 'video-telephone-add-modal',
    'url': '/rf/trans/add_video_telephone'
};
let VideoTelephoneAdd = Object.create(ModelLP);
VideoTelephoneAdd.model = video_telephone_add;


// 发布直播编辑模型
let live_broadcast_edit = {
    'id': 'live-broadcast-edit-modal',
    'url': '/rf/trans/edit?trans_type=1'
};
let LiveBroadCastEdit = Object.create(ModelLP);
LiveBroadCastEdit.model = live_broadcast_edit;


// 收看直播编辑模型
let watch_live_broadcast_edit = {
    'id': 'watch-live-broadcast-edit-modal',
    'url': '/rf/trans/edit?trans_type=2'
};
let WatchLiveBroadCastEdit = Object.create(ModelLP);
WatchLiveBroadCastEdit.model = watch_live_broadcast_edit;


// 可视电话编辑模型
let video_telephone_edit = {
    'id': 'video-telephone-edit-modal',
    'url': '/rf/trans/edit?trans_type=3'
};
let VideoTelephoneEdit = Object.create(ModelLP);
VideoTelephoneEdit.model = video_telephone_edit;

//************************************************************全网透传
// 全网透传（管理软件to管理软件）
let whole_net_transparent = {
    'id': 'whole-net-transparent-modal',
    'url': '/rf/trans/whole_net_transparent'
};
let WholeNetTransparent = Object.create(ModelLP);
WholeNetTransparent.model = whole_net_transparent;

// 查询二层透传状态
let query_two_trans_status = {
    'id': 'query-two-trans-status-modal',
    'url': '/rf/trans/whole_query_two_trans_status'
};
let WholeTwoTransStatusQuery = Object.create(ModelLP);
WholeTwoTransStatusQuery.model = query_two_trans_status;

// 查询二层透传信息
let query_two_trans_info = {
    'id': 'query-two-trans-info-modal',
    'url': '/rf/trans/whole_query_two_trans_info'
};
let WholeTwoTransInfoQuery = Object.create(ModelLP);
WholeTwoTransInfoQuery.model = query_two_trans_info;

// 创建二层透传通道
let create_two_trans_channel = {
    'id': 'create-two-trans-channel-modal',
    'url': '/rf/trans/whole_create_two_trans_channel'
};
let WholeTwoTransChannelCreate = Object.create(ModelLP);
WholeTwoTransChannelCreate.model = create_two_trans_channel;

// 创建和配置二层透传通道
let create_set_two_trans_channel = {
    'id': 'create-and-set-channel-modal',
    'url': '/rf/trans/whole_create_and_set_channel'
};
let WholeTwoTransChannelCreateSet = Object.create(ModelLP);
WholeTwoTransChannelCreateSet.model = create_set_two_trans_channel;

// 配置二层透传通道
let set_two_trans_channel = {
    'id': 'set-two-trans-channel-modal',
    'url': '/rf/trans/whole_set_two_trans_channel'
};
let WholeTwoTransChannelSet = Object.create(ModelLP);
WholeTwoTransChannelSet.model = set_two_trans_channel;

// 删除二层透传通道
let del_two_trans_channel = {
    'id': 'delete-two-trans-channel-modal',
    'url': '/rf/trans/whole_del_two_trans_channel'
};
let WholeTwoTransChannelDel = Object.create(ModelLP);
WholeTwoTransChannelDel.model = del_two_trans_channel;


// 全网发布直播
let q_live_broadcast_add = {
    'id': 'whole-net-live-broadcast-modal',
    'url': '/rf/trans/whole_net_live_broadcast'
};
let WholeNetWorkLiveBroadCast = Object.create(ModelLP);
WholeNetWorkLiveBroadCast.model = q_live_broadcast_add;

// 全网收看直播
let q_watch_live_broadcast_add = {
    'id': 'whole-net-watch-live-modal',
    'url': '/rf/trans/whole_net_watch_live_broadcast'
};
let WholeNetWorkBroadCast = Object.create(ModelLP);
WholeNetWorkBroadCast.model = q_watch_live_broadcast_add;


// 全网可视电话
let q_video_telephone_add = {
    'id': 'whole-net-video-telephone',
    'url': '/rf/trans/add_video_telephone'
};
let WholeNetVideoTelephone = Object.create(ModelLP);
WholeNetVideoTelephone.model = q_video_telephone_add;


// **********************************************************************文件管理
// 下载
let file_download_model = {
    'id': 'autonomy-file-download-modal',
    'url': '/rf/autonomy_file/download'
};
let AutonomyFileDownload = Object.create(ModelLP);
AutonomyFileDownload.model = file_download_model;

// 上传
let file_upload_model = {
    'id': 'autonomy-file-upload-modal',
    'url': '/rf/autonomy_file/upload'
};
let AutonomyFileUpload = Object.create(ModelLP);
AutonomyFileUpload.model = file_upload_model;

// 删除
let file_del_model = {
    'id': 'autonomy-file-del-modal',
    'url': '/rf/autonomy_file/delete'
};
let AutonomyFileDel = Object.create(ModelLP);
AutonomyFileDel.model = file_del_model;

// 获取文件特征信息
let file_feature_info_model = {
    'id': '',
    'url': '/rf/autonomy_file/file_feature'
};
let AutonomyFileFeatureInfo = Object.create(ModelLP);
AutonomyFileFeatureInfo.model = file_feature_info_model;


// **********************************************************************任务报告
// 测试任务报告
let schedule_report_modal = {
    'id': 'test-schedule-report',
    'url': '/rf/test_schedule/report'
};
let ScheduleReport = Object.create(ModelLP);
ScheduleReport.model = schedule_report_modal;


// **********************************************************************物理拓扑
// 拓扑索引
let physical_topology_index = {
    'id': '',
    'url': '/rf/physical_topology/topology_index'
};
let PhysicalTopologyIndex = Object.create(ModelLP);
PhysicalTopologyIndex.model = physical_topology_index;

// 拓扑详情
let physical_topology_detail = {
    'id': '',
    'url': '/rf/physical_topology/topology_detail'
};
let PhysicalTopologyDetail = Object.create(ModelLP);
PhysicalTopologyDetail.model = physical_topology_detail;

// 添加子节点
let physical_topology_add_node = {
    'id': 'node-add-modal',
    'url': '/rf/physical_topology/node_add'
};
let PhysicalTopologyAddNode = Object.create(ModelLP);
PhysicalTopologyAddNode.model = physical_topology_add_node;

// 获取子节点
let physical_topology_get_node = {
    'id': '',
    'url': '/rf/physical_topology/node_get'
};
let PhysicalTopologyGetNode = Object.create(ModelLP);
PhysicalTopologyGetNode.model = physical_topology_get_node;

// 删除子节点
let physical_topology_delete_node = {
    'id': '',
    'url': '/rf/physical_topology/node_delete'
};
let PhysicalTopologyDeleteNode = Object.create(ModelLP);
PhysicalTopologyDeleteNode.model = physical_topology_delete_node;

// 添加拓扑
let physical_topology_root_add = {
    'id': 'root-add-modal',
    'url': '/rf/physical_topology/root_add'
};
let PhysicalTopologyRootAdd = Object.create(ModelLP);
PhysicalTopologyRootAdd.model = physical_topology_root_add;

// 删除拓扑
let physical_topology_root_delete = {
    'id': '',
    'url': '/rf/physical_topology/root_delete'
};
let PhysicalTopologyRootDelete = Object.create(ModelLP);
PhysicalTopologyRootDelete.model = physical_topology_root_delete;

// 拓扑预览
let topology_preview_modal = {
    'id': 'topology-preview-modal',
    'url': '/rf/physical_topology/topology_preview'
};
let TopologyPreview = Object.create(ModelLP);
TopologyPreview.model = topology_preview_modal;

// 拓扑预览
let topology_upload_modal = {
    'id': 'topology-preview-modal',
    'url': '/rf/physical_topology/topology_upload'
};
let TopologyUpload = Object.create(ModelLP);
TopologyUpload.model = topology_upload_modal;

// 拓扑同步
let topology_sync_modal = {
    'id': '',
    'url': '/rf/physical_topology/topology_and_forward_sync'
};
let TopologySync = Object.create(ModelLP);
TopologySync.model = topology_sync_modal;

// 拓扑设备检查
let topology_device_check_modal = {
    'id': '',
    'url': '/rf/physical_topology/devices_check'
};
let TopologyDevicesCheck = Object.create(ModelLP);
TopologyDevicesCheck.model = topology_device_check_modal;

// 拓扑设备更新
let topology_device_update_modal = {
    'id': '',
    'url': '/rf/physical_topology/devices_update'
};
let TopologyDevicesUpdate = Object.create(ModelLP);
TopologyDevicesUpdate.model = topology_device_update_modal;

// 带宽编辑
let bc_edit_modal = {
    'id': 'bc-edit-modal',
    'url': '/rf/physical_topology/bc_edit'
};
let BcEdit = Object.create(ModelLP);
BcEdit.model = bc_edit_modal;

// 带宽预览
let bc_preview_modal = {
    'id': 'bc-preview-modal',
    'url': '/rf/physical_topology/bc_preview'
};
let BcPreview = Object.create(ModelLP);
BcPreview.model = bc_preview_modal;

// 带宽预览
let bc_upload_modal = {
    'id': 'bc-preview-modal',
    'url': '/rf/physical_topology/bc_upload'
};
let BcUpload = Object.create(ModelLP);
BcUpload.model = bc_upload_modal;

// 透传带宽设置
let trans_bandwidth_set = {
    'id': '',
    'url': '/rf/physical_topology/trans_bandwidth_set'
};
let TransBandwidthSet = Object.create(ModelLP);
TransBandwidthSet.model = trans_bandwidth_set;

// 交换机重命名
let switch_rename = {
    'id': 'switch-rename-modal',
    'url': '/rf/physical_topology/switch_rename'
};
let SwitchRename = Object.create(ModelLP);
SwitchRename.model = switch_rename;

// //设置自治服务器
// // todo:
// let serveruser_edit_model = {
//     'id': 'server_user-edit-modal',
//     'url': '/rf/autonomy_server/serverconfig'
// };
// let AutonomyUserServerEdit = Object.create(ModelLP);
// AutonomyUserServerEdit.model = serveruser_edit_model;
//
//
// //恢复默认设置
// // todo:
// let serveruser_add_model = {
//     'id': 'server_user-add-modal',
//     'url': ''
// };
// let AutonomyUserServeradd = Object.create(ModelLP);
// AutonomyUserServeradd.model = serveruser_add_model;

//
// **********************************************************************转发关系
// 转发关系索引
let forward_relation_index = {
    'id': '',
    'url': '/rf/forward_relation/forward_relation_index'
};
let ForwardRelationIndex = Object.create(ModelLP);
ForwardRelationIndex.model = forward_relation_index;

// 转发关系新增
let forward_relation_add = {
    'id': 'forward-relation-add-modal',
    'url': '/rf/forward_relation/forward_relation_add'
};
let ForwardRelationAdd = Object.create(ModelLP);
ForwardRelationAdd.model = forward_relation_add;

//　转发关系删除
let forward_relation_delete = {
    'id': '',
    'url': '/rf/forward_relation/forward_relation_delete'
};
let ForwardRelationDelete = Object.create(ModelLP);
ForwardRelationDelete.model = forward_relation_delete;

// 转发关系编辑
let forward_relation_edit = {
    'id': 'forward-relation-edit-modal',
    'url': '/rf/forward_relation/forward_relation_edit'
};
let ForwardRelationEdit = Object.create(ModelLP);
ForwardRelationEdit.model = forward_relation_edit;

//　转发关系重置
let forward_relation_reset = {
    'id': '',
    'url': '/rf/forward_relation/forward_relation_reset'
};
let ForwardRelationReset = Object.create(ModelLP);
ForwardRelationReset.model = forward_relation_reset;

//　转发关系上传
let forward_relation_upload = {
    'id': '',
    'url': '/rf/forward_relation/forward_relation_upload'
};
let ForwardRelationUpload = Object.create(ModelLP);
ForwardRelationUpload.model = forward_relation_upload;


// **********************************************************************路由规则
// 路由规则索引
let routing_rule_index = {
    'id': '',
    'url': '/rf/routing_rules/routing_rules_index'
};
let RoutingRuleIndex = Object.create(ModelLP);
RoutingRuleIndex.model = routing_rule_index;

// 路由规则详情
let routing_rule_detail = {
    'id': '',
    'url': '/rf/routing_rules/routing_rules_detail'
};
let RoutingRuleDetail = Object.create(ModelLP);
RoutingRuleDetail.model = routing_rule_detail;

//　路由规则新增
let routing_rule_add = {
    'id': 'routing-rule-add-modal',
    'url': '/rf/routing_rules/routing_rules_add'
};
let RoutingRuleAdd = Object.create(ModelLP);
RoutingRuleAdd.model = routing_rule_add;

// 路由规则编辑
let routing_rule_edit = {
    'id': 'routing-rule-edit-modal',
    'url': '/rf/routing_rules/routing_rules_edit'
};
let RoutingRuleEdit = Object.create(ModelLP);
RoutingRuleEdit.model = routing_rule_edit;

//　路由规则删除
let routing_rule_delete = {
    'id': '',
    'url': '/rf/routing_rules/routing_rules_delete'
};
let RoutingRuleDelete = Object.create(ModelLP);
RoutingRuleDelete.model = routing_rule_delete;

//　路由规则重置
let routing_rule_reset = {
    'id': '',
    'url': '/rf/routing_rules/routing_rules_reset'
};
let RoutingRuleReset = Object.create(ModelLP);
RoutingRuleReset.model = routing_rule_reset;

//　路由规则上传
let routing_rule_upload = {
    'id': '',
    'url': '/rf/routing_rules/routing_rules_upload'
};
let RoutingRuleUpload = Object.create(ModelLP);
RoutingRuleUpload.model = routing_rule_upload;

//　随机路由规则
let routing_rule_random = {
    'id': '',
    'url': '/rf/routing_rules/routing_rules_random'
};
let RoutingRuleRandom = Object.create(ModelLP);
RoutingRuleRandom.model = routing_rule_random;

// 获取分控模型
let slave_get = {
    'id': '',
    'url': '/rf/routing_rules/slave_get'
};
let SlaveGet = Object.create(ModelLP);
SlaveGet.model = slave_get;
