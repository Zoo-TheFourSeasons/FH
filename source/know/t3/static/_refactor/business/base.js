
axios.interceptors.response.use(function (response) {
    // hook response
    let content = "";
    let message = response.data.message;

    if (message === undefined) {
        return response;
    }
    if (typeof message === 'object' && Object.keys(message).length !== 0) {
        content = Object.values(message).join('<br>');
    }
    else if (typeof message === 'string') {
        content = message;
    }

    if (response.data.status) {
        // 执行成功
        // 仍然有消息要显示
        if (content) {

        }
    }
    else {
        // 执行失败
        // confirm 强制显示
        if (content) {
            confirm_tip('警告! ', content)
        }
    }
    return response;
});


function get_jsTree_selected(tree_container) {
    // 获取 jsTree 已选节点(过滤子节点)
    let $tree_container = $('.' + tree_container);
    let selected = $tree_container.jstree().get_selected(true);

    // 按层划分节点
    let nodes = {'root': [], 'slave': [], 'none': [], 'sub_device': []};
    for (let node_i = 0; node_i < selected.length; node_i++) {
        let node_obj = selected[node_i];
        let parents = node_obj.parents;
        let node = {
            'type': node_obj.data.switch_type,
            'id': node_obj.id,
            'prefix_number': node_obj.data.prefix_number,
            'text': node_obj.text,
            'parent': node_obj.parent,
            'none': '',
            'root': ''
        };

        if (parents.length === 1){
            // 主控
            node.root = node_obj.text;
            nodes.root.push(node)
        } else if (parents.length === 2) {
            // 分控 上边界 下边界
            let root_node = $tree_container.jstree().get_node(parents[0]);
            node.root = root_node.text;
            nodes.slave.push(node)
        } else if (parents.length === 3) {
            // 终端
            let root_node = $tree_container.jstree().get_node(parents[1]);
            node.root = root_node.text;
            nodes.none.push(node)
        } else if (parents.length === 4) {
            // 子设备
            let root_node = $tree_container.jstree().get_node(parents[2]);
            let none_node = $tree_container.jstree().get_node(parents[0]);
            node.root = root_node.text;
            node.none = none_node.text;
            nodes.sub_device.push(node)
        }
    }

    // 过滤已勾选子节点
    let types = [nodes.root, nodes.slave, nodes.none, nodes.sub_device];
    let temp = [];
    let n = [];
    for (let type_i=0; type_i<types.length; type_i++){
        for (let node_i=0; node_i<types[type_i].length; node_i++){
            let node = types[type_i][node_i];
            temp.push(node.id + '-' + node.prefix_number);
            if (node.parent !== '#' && temp.indexOf(node.parent + '-' + node.prefix_number) !== -1){
                continue
            }
            n.push(node);
        }
    }
    console.log('nodes', n);
    return n
}


function confirm_tip(title, content) {
    // 提示信息
    let confirm = $.confirm({
        closeIcon: false,
        columnClass: 'col-md-12',
        theme: 'supervan',
        type: 'red',
        title: title,
        content: content,
        buttons: {
            cancel: {
                text: '关闭',
                btnClass: 'btn-warning'
            }
        }
    });
    confirm.open();
}



function add_test_case_call_back(rsp, r) {
    // 添加测试用例成功后的回调
    console.log(rsp);
    let confirm = $.confirm({
        closeIcon: false,
        columnClass: 'col-md-12',
        theme: 'supervan',
        type: 'red',
        title: '添加成功',
        content: '测试用例已添加',
        buttons: {
            ok: {
                text: '继续添加',
                action: function () {
                    window.location.reload()
                }
            },
            cancel: {
                text: '返回任务',
                action: function () {
                    history.back()
                }
            }
        }
    });
    confirm.open();
}


function request(params) {
    let url = params.url;
    let method = params.method;
    let data = params.data;
    let success = params.success;
    let success_params = params.success_params;
    let failed = params.failed;
    let failed_params = params.failed_params;
    let btn = params.btn;
    let header = params.header;
    let after = params.after;
    let after_params = params.after_params;

    if (header === undefined){
        header = {}
    }

    let config;
    if (method === "get") {
        config = {url: url, method: method, params: data, headers: header}
    }
    else if (method === 'post') {
        config = {url: url, method: method, data: data, headers: header}
    }

    if (btn !== undefined) {
        btn.attr('disabled', 'true');
    }
    axios.request(config)
        .then(function (response) {
            // 结束回调
            if (after !== undefined) {
                after(response, after_params)
            }
            else {
                // 正常回调
                if (response.data.status) {
                    if (success !== undefined) {
                        success(response, success_params);
                    }
                }
                // 错误回调
                else {
                    if (failed !== undefined) {
                        failed(response, failed_params);
                    }
                }
            }
            if (btn !== undefined) {
                btn.attr('disabled', false);
            }
        })
        .catch(function (error) {
            if (btn !== undefined) {
                btn.attr('disabled', false);
            }
            console.log(error);
        });
}


function post(params) {
    params.method = 'post';
    request(params)
}


function get(params) {
    params.method = 'get';
    request(params)
}


// 获取表格 id 字段
function get_table_id_field(table) {
    let id_field = '';
    for (let i =0; i<table.length; i++) {
        if (Object.keys(table[i].dataset).length === 0) {
            break
        }
        if (Object.keys(table[i].dataset.idField).length === 0) {
            break
        }
        id_field = table[i].dataset['idField'];
    }
    return id_field
}

// 获取表格已选数据 id
function get_table_selected_id(table, id_field) {
    let data = table.bootstrapTable('getSelections');
    let ids = [];
    for (let k = 0; k < data.length; k++) {
        ids.push(data[k][id_field])
    }
    return ids
}


function buildTable($el, cells, rows) {
    let i;
    let j;
    let row;
    let columns = [];
    let data = [];

    for (i = 0; i < cells; i++) {
        columns.push({
            field: 'field' + i,
            title: 'Cell' + i,
            sortable: true
        })
    }
    for (i = 0; i < rows; i++) {
        row = {};
        for (j = 0; j < cells; j++) {
            row['field' + j] = 'Row-' + i + '-' + j
        }
        data.push(row)
    }

    $el.bootstrapTable('destroy').bootstrapTable({
        columns: columns,
        data: data,
        search: false,
        stickyHeader: true,
        theadClasses: 'thead-dark'
    })
}


//  模态框拖动 居中
$(document).on("show.bs.modal", ".modal", function () {
    $(this).draggable({cursor: 'move'});
    $(this).css("overflow", "hidden");
    $(this).css('display', 'block');
});


// 选择tree节点
function select_tree_node(name) {
    let $topology = $('#topology');
    let selected = $topology.treeview('search', [name, {
        ignoreCase: false,
        exactMatch: true
    }, 'text']);
    selected = selected[0];
    $topology.treeview('selectNode', [selected.nodeId, {silent: true}]);
}

function get_selected(table_id, with_version) {
    let table = $("#" + table_id);

    let data = $(table).bootstrapTable('getSelections');
    let ids_ = [];
    let versions_ = [];
    if (data.length === 0) {
        return {}
    }
    for (let i = 0; i < data.length; i++) {
        ids_.push(data[i].id);
        if (with_version) {
            versions_.push(data[i].version);
        }
    }
    if (with_version) {
        return {'ids': ids_.join(','), 'versions': versions_.join(',')};
    }
    return {'ids': ids_.join(',')};

}


function adjust_height(table) {
    let height = $(document).height() - table.offset().top;
    console.log('document', $(document).height());
    console.log(table.offset().top);
    table.bootstrapTable('resetView', {height: height});
    table.bootstrapTable('refresh');
}


function search_move(table) {
    let $search = $("#search");
    let $input = $(".search input");
    $search.empty();
    $search.append($(".fixed-table-toolbar"));

    $(".search").css("width", '100%');

    $input.addClass('form-control-dark w-100');
    $input.css("width", '100%');
    $input.attr('placeholder', '搜索');

    if (table === undefined)
        return ;
    adjust_height(table);
}


// 显示 不可拖拽的d3 树
function display_d3_tree(params) {
    let root = params.data;
    let container = params.container;
    let fill_function = params.fill_function;
    let viewer_width = params.viewer_width;
    let viewer_height = params.viewer_height;

    root.x0 = 0;
    root.y0 = 0;
    // Calculate total nodes, max label length
    let totalNodes = 0;
    let maxLabelLength = 0;

    let i = 0;
    let duration = 650;
    // size of the diagram
    // let viewerWidth = width;
    // let viewerHeight = height;

    let tree = d3.layout.tree().size([viewer_height, viewer_width]);

    // define a d3 diagonal projection for use by the node paths later on.
    let diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    // A recursive helper function for performing some setup by walking through all nodes

    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        let children = childrenFn(parent);

        if (children) {
            let count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // Call visit function to establish maxLabelLength
    visit(root, function (d) {
        totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);

    }, function (d) {

        if (d.children && d.children.length > 0){
            let ns = [];
            let children = d.children;
            let match = false;

            for (var i = 0; i < children.length; i++) {
                match = false;
                for (var j=0; j < ns.length; j ++){
                    if (children[i].name === ns[j].name) {
                        match = true;
                        break;
                    }
                }
                if (!match){
                    ns.push(children[i])
                }
            }
            d.children = ns;
            return d.children;
        } else{
            return null
        }
    });


    // sort the tree according to the node names

    function sortTree() {
        tree.sort(function (a, b) {
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
        });
    }

    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();

    // Define the zoom function for the zoomable tree

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    let zoomListener = d3.behavior.zoom().scaleExtent([0.3, 2]).on("zoom", zoom);

    // define the baseSvg, attaching a class for styling and the zoomListener
    let baseSvg = d3.select(container).append("svg")
        .attr("width", viewer_width)
        .attr("height", viewer_height)
        .attr("class", "overlay")
        .call(zoomListener);

    function centerNode(source) {
        let scale = zoomListener.scale();
        let x;
        let y;
        // if (typeof source.x0 === 'number' && isFinite(source.x0)){
        // }
        x = -source.y0 * scale + viewer_width / 2 - 350;
        y = -source.x0 * scale + viewer_height / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // Toggle children function
    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }

    // Toggle children on click.

    function click(d) {
        if (d3.event.defaultPrevented) return; // click suppressed
        d = toggleChildren(d);
        update(d);
        select_tree_node(d.name)
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        let levelWidth = [1];
        let childCount = function (level, n) {
            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function (d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        let newHeight = d3.max(levelWidth) * 20; // 25 pixels per line
        tree = tree.size([newHeight, viewer_width]);

        // Compute the new tree layout.
        let nodes = tree.nodes(root).reverse();
        let links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function (d) {
            d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            // d.y = (d.depth * 500); //500px per level.#}
        });

        // Update the nodes…
        let node = svgGroup.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter().append("g")
        // .call(dragListener)#}
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click);

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function (d) {
                return d._children ? "#0b97ff" : "#fff";
            });

        nodeEnter.append("text")
            .attr("x", function (d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.name;
            })
            .style("fill-opacity", 0);

        // Update the text to reflect whether node has children or not.
        node.select('text')
            .attr("x", function (d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.name;
            });

        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", 4)
            .style("fill", fill_function);


        // Transition nodes to their new position.
        let nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        let nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        let link = svgGroup.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                let o = {
                    x: source.x0,
                    y: source.y0
                };

                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                let o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // centerNode(root);#}
    }

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    let svgGroup = baseSvg.append("g");

    // Define the root


    // Layout the tree initially and center on the root node.
    update(root);
    centerNode(root);
}


function display_d3_drag_tree(params) {
    let treeData = params.data;
    let container = params.container;
    let drag_call_back = params.drag_call_back;
    let viewer_width = params.viewer_width;
    let viewer_height = params.viewer_height;

    let root;
    let totalNodes = 0;
    let maxLabelLength = 0;
    // variables for drag/drop
    let selectedNode = null;
    let draggingNode = null;
    // panning variables
    let panSpeed = 100;
    let panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    let i = 0;
    let duration = 650;

    // size of the diagram
    let viewerWidth = viewer_width;
    let viewerHeight = viewer_height;

    let tree;
    tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth]);

    // define a d3 diagonal projection for use by the node paths later on.
    let diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    // A recursive helper function for performing some setup by walking through all nodes

    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        let children = childrenFn(parent);
        if (children) {
            let count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // Call visit function to establish maxLabelLength
    visit(treeData, function (d) {
        totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);

    }, function (d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });


    // sort the tree according to the node names

    function sortTree() {
        tree.sort(function (a, b) {
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
        });
    }

    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();

    function pan(domNode, direction) {
        let speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            let translateCoords = d3.transform(svgGroup.attr("transform"));
            let translateX, translateY;

            if (direction === 'left' || direction === 'right') {
                translateX = direction === 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction === 'up' || direction === 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction === 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            let scaleX = translateCoords.scale[0];
            let scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            let panTimer = setTimeout(function () {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    let zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    function initiateDrag(d, domNode) {
        draggingNode = d;
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
        d3.select(domNode).attr('class', 'node activeDrag');

        svgGroup.selectAll("g.node").sort(function (a, b) { // select the parent and sort the path's
            if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
            else return -1; // a is the hovered element, bring "a" to the front
        });
        // if nodes has children, remove the links and nodes
        if (nodes.length > 1) {
            // remove link paths
            links = tree.links(nodes);
            nodePaths = svgGroup.selectAll("path.link")
                .data(links, function (d) {
                    return d.target.id;
                }).remove();
            // remove child nodes
            nodesExit = svgGroup.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id;
                }).filter(function (d, i) {
                    if (d.id == draggingNode.id) {
                        return false;
                    }
                    return true;
                }).remove();
        }

        // remove parent link
        parentLink = tree.links(tree.nodes(draggingNode.parent));
        svgGroup.selectAll('path.link').filter(function (d, i) {
            if (d.target.id == draggingNode.id) {
                return true;
            }
            return false;
        }).remove();

        dragStarted = null;
    }

    // define the baseSvg, attaching a class for styling and the zoomListener
    let baseSvg = d3.select(container).append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);


    // Define the drag listeners for drag/drop behaviour of nodes.
    let dragListener = d3.behavior.drag()
        .on("dragstart", function (d) {
            if (d == root) {
                return;
            }
            dragStarted = true;
            nodes = tree.nodes(d);
            d3.event.sourceEvent.stopPropagation();
            // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
        })
        .on("drag", function (d) {
            if (d == root) {
                return;
            }
            if (dragStarted) {
                domNode = this;
                initiateDrag(d, domNode);
            }

            // get coords of mouseEvent relative to svg container to allow for panning
            relCoords = d3.mouse($('svg').get(0));
            if (relCoords[0] < panBoundary) {
                panTimer = true;
                pan(this, 'left');
            } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

                panTimer = true;
                pan(this, 'right');
            } else if (relCoords[1] < panBoundary) {
                panTimer = true;
                pan(this, 'up');
            } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
                panTimer = true;
                pan(this, 'down');
            } else {
                try {
                    clearTimeout(panTimer);
                } catch (e) {

                }
            }

            d.x0 += d3.event.dy;
            d.y0 += d3.event.dx;
            let node = d3.select(this);
            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
            updateTempConnector();
        }).on("dragend", function (d) {
            if (d == root) {
                return;
            }
            domNode = this;
            if (selectedNode) {
                // now remove the element from the parent, and insert it into the new elements children
                let index = draggingNode.parent.children.indexOf(draggingNode);
                if (index > -1) {
                    draggingNode.parent.children.splice(index, 1);
                }
                if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                    if (typeof selectedNode.children !== 'undefined') {
                        selectedNode.children.push(draggingNode);
                    } else {
                        selectedNode._children.push(draggingNode);
                    }
                } else {
                    selectedNode.children = [];
                    selectedNode.children.push(draggingNode);
                }
                // Make sure that the node being added to is expanded so user can see added node is correctly moved
                expand(selectedNode);
                sortTree();
                endDrag();
            } else {
                endDrag();
            }
        });

    function endDrag() {
        selectedNode = null;
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
        d3.select(domNode).attr('class', 'node');
        // now restore the mouseover event or we won't be able to drag a 2nd time
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
        updateTempConnector();
        if (draggingNode !== null) {
            update(root);
            // centerNode(draggingNode);
            // 保存
            let current = draggingNode.name;
            let pre = draggingNode.parent.name;
            draggingNode = null;

            if (drag_call_back){
                drag_call_back(current, pre);
            }
            //
            // function f(response) {
            //     if (response.data.status) {
            //
            //     } else{
            //         let values = [];
            //         for (var z in response.data.message){
            //             values.push(response.data.message[z])
            //         }
            //         confirm_tip(values.join(';'));
            //     }
            // }
            // get(url_save, {'current': current, 'pre': pre}, f, '');

        }
    }

    // Helper functions for collapsing and expanding nodes.

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

    let overCircle = function (d) {
        selectedNode = d;
        updateTempConnector();
    };
    let outCircle = function (d) {
        selectedNode = null;
        updateTempConnector();
    };

    // Function to update the temporary connector indicating dragging affiliation
    let updateTempConnector = function () {
        let data = [];
        if (draggingNode !== null && selectedNode !== null) {
            // have to flip the source coordinates since we did this for the existing connectors on the original tree
            data = [{
                source: {
                    x: selectedNode.y0,
                    y: selectedNode.x0
                },
                target: {
                    x: draggingNode.y0,
                    y: draggingNode.x0
                }
            }];
        }
        let link = svgGroup.selectAll(".templink").data(data);

        link.enter().append("path")
            .attr("class", "templink")
            .attr("d", d3.svg.diagonal())
            .attr('pointer-events', 'none');

        link.attr("d", d3.svg.diagonal());

        link.exit().remove();
    };

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

    function centerNode(source) {
        let scale = zoomListener.scale();
        x = -source.y0;
        y = -source.x0;
        x = x * scale + viewerWidth / 2 - 180;
        y = y * scale + viewerHeight / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // Toggle children function

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }

    // Toggle children on click.

    function click(d) {
        if (d3.event.defaultPrevented) return; // click suppressed
        d = toggleChildren(d);
        update(d);
        centerNode(d);
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        let levelWidth = [1];
        let childCount = function (level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function (d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        let newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        let nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function (d) {
            d.y = (d.depth * (maxLabelLength * 17)); //maxLabelLength * 17px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            // d.y = (d.depth * 500); //500px per level.
        });

        // Update the nodes…
        let node = svgGroup.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter().append("g")
            .call(dragListener)
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click);

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
            .attr("x", function (d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.name;
            })
            .style("fill-opacity", 0);

        // phantom node to give us mouseover in a radius around it
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 35)
            .attr("opacity", 0.2) // change this to zero to hide the target area
            .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function (node) {
                overCircle(node);
            })
            .on("mouseout", function (node) {
                outCircle(node);
            });

        // Update the text to reflect whether node has children or not.
        node.select('text')
            .attr("x", function (d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.name;
            });

        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", 6)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Transition nodes to their new position.
        let nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        let nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        let link = svgGroup.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                let o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                let o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    let svgGroup = baseSvg.append("g");

    // Define the root
    root = treeData;
    root.x0 = 0;
    root.y0 = 0;

    // Layout the tree initially and center on the root node.
    update(root);
    centerNode(root);
}


// 显示 treeview 树 #}
function display_topology(params) {
    let data = params.data;
    let fill_function = params.fill_function;
    let container = params.container;
    let viewer_width = params.viewer_width;
    let viewer_height = params.viewer_height;

    $('#topology').treeview({
        expandIcon: 'glyphicon glyphicon-chevron-right',
        collapseIcon: 'glyphicon glyphicon-chevron-down',
        selectable: true,
        showBorder: true,
        showTags: true,
        highlightSelected: true,
        data: [data]

    });

    $(container).empty();
    display_d3_tree({
        'data': data,
        'container': container,
        'fill_function': fill_function,
        'viewer_width': viewer_width,
        'viewer_height': viewer_height
    });
}


// 添加bootstrap-treeview
function add_tree_view(topology) {
    let icons = {'master': 'glyphicon glyphicon-transfer',
                 'root': 'glyphicon glyphicon-home',
                 'switch': 'glyphicon glyphicon-random',
                 'slave': 'glyphicon glyphicon-hdd',
                 'child': 'glyphicon glyphicon-transfer',
                 'none': 'glyphicon glyphicon-console'};

    let tags = {'master': '上边界',
                'root': '主控',
                'switch': '交换机',
                'slave': '分控',
                'child': '下边界',
                'none': '终端'};

    let children_field = 'nodes';
    let node_name, node, switch_type;

    for (node_name in topology){
        node = topology[node_name];
        if (node['children__'] !== undefined && node['children__'].length > 0){
            node[children_field] = [];

        }
        switch_type = node['switch_type'];
        node['text'] = node['name'];
        node['icon'] = icons[switch_type];
        node['tags'] = [tags[switch_type]]
    }

    return {'top': topology, 'children_field': children_field}
}


// 创建嵌套树字段
function build_tree_data(topology, add_view) {
    let topc, continue_, k, children_field;

    // 添加bootstrap-treeview
    if (add_view){
        topc = add_tree_view(topology);
        topology = topc.top;
        children_field = topc.children_field
    }

    // 叶节点过滤
    function filter_bottom(node) {
        let is_bottom = true;
        let children = node['children__'];
        let children_length;
        let i;

        if (children === undefined){
            return is_bottom
        }
        children_length = children.length;
        if (children_length === 0){
            return is_bottom
        }

        for (i =0; i<children_length; i++){
            if (children[i] in topology){
                is_bottom = false
            }
        }
        return is_bottom
    }

    // 节点组合
    function merge(topology_){
        let bottoms_master = [];
        let bottoms = {};
        let tops = {};
        let i;
        let n;
        let top_nodes;

        // 过滤
        // bottoms_master = list(filter(filter_bottom, topology_))
        // for (i =0; i < topology_.length; i++){
        for (i in topology_){
            n = topology_[i];
            if (filter_bottom(n)){
                bottoms_master.push(i);
            }
        }
        // 底层
        // bottoms = dict([(n, topology_[n]) for n in bottoms_master])
        for (i =0; i < bottoms_master.length; i++){
            n = bottoms_master[i];
            bottoms[n] = topology_[n];
        }

        // 上层
        // tops = dict([(n, topology_[n]) for n in topology_ if n not in bottoms_master])
        for (i in topology_){
            n = topology_[i];
            if (bottoms_master.indexOf(i) === -1){
                tops[i] = n
            }
        }

        if (Object.keys(tops).length === 0){
            return {'top': bottoms, 'continue_': false};
        }

        for (i in bottoms){
            for (n in tops){
                top_nodes = tops[n]['children__'];
                if (top_nodes.indexOf(i) !== -1){
                    if (tops[n]['children'] === undefined){
                        tops[n]['children'] = []
                    }

                    tops[n]['children'].push(bottoms[i]);

                    if (add_view){
                        tops[n][children_field].push(bottoms[i])
                    }
                }
            }
        }
        return {'top': tops, 'continue_': true};
    }

    topc = merge(topology);
    topology = topc.top;
    continue_ = topc.continue_;

    while (continue_){
        topc = merge(topology);
        topology = topc.top;
        continue_ = topc.continue_;
    }

    for (k in topology){
        return topology[k];
    }
}


function display_d3_arrow_map(params) {
    let links = params.links;
    let container = params.container;
    let distance = params.distance;
    let density = params.density;

    let nodes = {};
    let i;
    // Compute the distinct nodes from the links.
    if (links === undefined){
        return
    }
    for (i=0; i< links.length; i++){
        links[i].source = nodes[links[i].source] || (nodes[links[i].source] = {name: links[i].source});
        links[i].target = nodes[links[i].target] || (nodes[links[i].target] = {name: links[i].target});
    }

    let force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width - 50, height])
        .linkDistance(parseInt(distance, 10))
        .charge(parseInt(density, 10))
        .on("tick", tick)
        .start();

    let svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height);

// Per-type markers, as they don't inherit styles.
    svg.append("defs").selectAll("marker")
        .data(["suit", "licensing", "resolved"])
        .enter().append("marker")
        .attr("id", function (d) {
            return d;
        })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");

    let path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function (d) {
            return "link " + d.type;
        })
        .attr("marker-end", function (d) {
            return "url(#" + d.type + ")";
        });

    let circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
        .enter().append("circle")
        .attr("r", 8)
        .call(force.drag);

    let text = svg.append("g").selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("x", 10)
        .attr("y", "0.3em")
        .text(function (d) {
            return d.name;
        });

// Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
    }

    function linkArc(d) {
        let dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + 0 + "," + 0 + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }
}
