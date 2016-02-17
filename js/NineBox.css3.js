/* =========================================================== *
 * @site http:tt-cc.cn
 * @email mvpjly@163.com
 * Copyright 2014 imwr
 * Licensed under the Apache License, Version 2.0 (the "License")
 * =========================================================== */
;
(function ($) {
    var defaults = {
        showMoveLine: true,//是否显示鼠标移动路径
        zindex: 100,//九宫格z-index属性
        radius: 25,//圆环半径
        backgroundColor: "#333",//背景色
        color: "#FFFFFF",//圆环颜色
        pwd: "123",//密码数组
        encrypt: false, //是否加密
        errorColor: '#FF0000',//解锁失败锁环颜色
        boxTimer: 1000,//错误时清除记录间隔
        lineColor: '#5B8FEF',//线颜色
        extClass: null,//额外的样式
        lineWidth: 8,//线宽度
        width: 240,//容器宽度
        height: 240,//容器高度
        onError: function () {
        },//密码错误执行的操作
        onSuc: function () {
        }//成功解锁执行的操作
    };
    $.fn.nineBox = function (method) {
        var args = arguments;
        return this.each(function () {
            var ui = $._data(this, "NineBox");
            if (!ui) {
                var opts = $.extend({}, defaults, typeof method == 'object' && method);
                if ($.support.leadingWhitespace) {
                    var style = document.createElement("div").style;
                    var css = ["transform", "WebkitTransform", "MozTransform", "msTransform", "OTransform"];
                    for (var i in css) {
                        if (typeof  style[css[i]] != "undefined") {
                            ui = new NineBox(this, opts);
                            break;
                        }
                    }
                    $._data(this, "NineBox", ui);
                } else { //ie6-8
                    console.log("mode is not support ! ie mode is development ~")
                }
            }
            if (typeof method === "string" && typeof ui[method] == "function") {
                ui[method].apply(ui, Array.prototype.slice.call(args, 1));
            }
        });
    };
    var NineBox = function (element, options) {
        this.ele = $(element);
        this.options = options;
        return "undefined" != typeof this.init && this.init.apply(this, arguments)
    };
    NineBox.prototype = {
        init: function () {
            this.options.pointRadii = this.options.lineWidth * 2 / 3;
            if (this.options.encrypt && !window.CryptoJS) {
                return alert("Please import box.encrypt.js to encrypt pwd");
            }
            this.ele.css({"position": "relative"}).append(this.buildBox());
            this.lineArray = [];
            this.selectedArray = [];
            this._addMouseDownEvent();
            this._addMouseMoveEvent();
            this._addMouseUpEvent();
        },
        buildBox: function () {
            if (this.options.width < this.options.radius * 6 || this.options.height < this.options.radius * 6) {
                console.log("圆环半径太大，容器装不下了~");
                return;
            }
            var temp = $(document.createDocumentFragment());
            this.target = $(document.createElement("div")).css({
                "width": this.options.width,
                "height": this.options.height,
                "backgroundColor": this.options.backgroundColor,
                "zindex": this.options.zindex,
                "overflow": "hidden",
                "position": "relative",
                "webkitUserSelect": "none",
                "webkitUserDrag": "none"
            }).addClass(this.options.extClass);
            var imargin = this.options.radius - this.options.pointRadii - 2;
            for (var i = 0; i < 9; i++) {
                var dbox = $(document.createElement("li")).css({
                    cursor: "pointer",
                    marginLeft: this.options.width / 6 - this.options.radius,
                    marginRight: this.options.width / 6 - this.options.radius,
                    marginTop: this.options.height / 6 - this.options.radius,
                    marginBottom: this.options.height / 6 - this.options.radius,
                    float: "left",
                    listStyleType: "none",
                    width: this.options.radius * 2,
                    borderRadius: this.options.radius,
                    height: this.options.radius * 2,
                    position: "relative",
                    border: "2px solid " + this.options.color,
                    boxSizing: "border-box"
                });
                var ibox = $(document.createElement("span")).css({
                    border: "1px solid " + this.options.color,
                    boxSizing: "border-box",
                    width: this.options.pointRadii * 2,
                    height: this.options.pointRadii * 2,
                    borderRadius: this.options.pointRadii,
                    position: "absolute",
                    top: imargin,
                    left: imargin
                });
                temp.append(this.target.append(dbox.append(ibox)));
            }
            return temp;
        },
        _addMouseDownEvent: function () {
            var _this = this;
            _this.target.on("touchstart mousedown", "li", function () {
                if (!_this.nineBoxMouseDown) {
                    _this.nineBoxMouseDown = true;
                    _this.nineBoxMouseUp = false;
                    $(this).addClass('ninebox-selected').css('border-color', _this.options.lineColor)
                        .find("span").css({
                            "backgroundColor": _this.options.lineColor,
                            "borderColor": _this.options.lineColor
                        });
                    _this.selectedArray = [];
                    _this.selectedArray.push(this);
                }
            });
            $(document).on("touchmove mousemove", {that: _this}, function (e) {
                return !_this.nineBoxMouseDown;
            });
        },
        _addMouseUpEvent: function () {
            var _this = this;
            $(this.target).on("touchend mouseup", function () {
                _this.moveLine && $(_this.moveLine).remove() && (_this.moveLine = null);
                _this.nineBoxMouseUp = true;
                if (_this.selectedArray.length == 0) {
                    return;
                }
                var lis = _this.ele.find("li"), pwd = "";
                for (var i = 0; i < _this.selectedArray.length; i++) {
                    pwd += "" + (lis.index(_this.selectedArray[i]) + 1);
                }
                if (_this.options.pwd == (_this.options.encrypt ? CryptoJS.SHA3(pwd).toString() : pwd)) { //如果成功解锁
                    if (typeof _this.options.onSuc == "function") {
                        _this.options.onSuc();
                    }
                    _this.removeLine();
                    for (var i = 0; i < _this.selectedArray.length; i++) {
                        $(_this.selectedArray[i]).removeClass('ninebox-selected')
                            .css("border-color", _this.options.color).find("span").css({
                                "background": "none",
                                "borderColor": _this.options.color
                            });
                    }
                    _this.selectedArray = [];
                    _this.nineBoxMouseDown = false;
                } else {
                    if (typeof _this.options.onError == "function") {
                        _this.options.onError();
                    }
                    for (var i = 0; i < _this.selectedArray.length; i++) {
                        $(_this.selectedArray[i]).css("border-color", _this.options.errorColor).find("span").css({
                            "backgroundColor": _this.options.errorColor,
                            "borderColor": _this.options.errorColor
                        });
                    }
                    for (var j = 0; j < _this.lineArray.length; j++) {
                        $(_this.lineArray[j]).css("background", _this.options.errorColor);
                    }
                    _this.timer && clearTimeout(_this.timer);
                    _this.timer = setTimeout(function () {
                        for (var i = 0; i < _this.selectedArray.length; i++) {
                            $(_this.selectedArray[i]).removeClass('ninebox-selected').css("border-color", _this.options.color).find("span").css({
                                "background": "none",
                                "borderColor": _this.options.color
                            });
                        }
                        _this.selectedArray = [];
                        _this.removeLine();
                        clearTimeout(_this.timer);
                        _this.nineBoxMouseDown = false;
                    }, _this.options.boxTimer);
                }
            });
        },
        eleTouchMoveIn: function (e) {
            if (e.type != "touchmove") {
                return (e.target || e.srcElement);
            }
            var x = e.originalEvent.targetTouches[0].pageX,
                y = e.originalEvent.targetTouches[0].pageY,
                offsetX = x - this.target.offset().left,
                offsetY = y - this.target.offset().top;
            if (offsetX < 0 || offsetX > this.options.width || offsetY < 0 || offsetY > this.options.height) return null;
            var index = Math.ceil(offsetX / (this.options.width / 3)),
                indey = Math.ceil(offsetY / (this.options.height / 3));
            var marginLeft = this.options.width / 6 - this.options.radius,
                marginTop = this.options.height / 6 - this.options.radius,
                lr = this.options.radius * 2, num = 0;
            var inCirle = false;
            if (offsetX > (index * 2 - 1) * marginLeft + lr * (index - 1) && offsetX > (index * 2 - 1) * marginLeft + lr * (index - 1)) {
                if (offsetY < (indey * 2 - 1) * marginTop + lr * indey && offsetY > (indey * 2 - 1) * marginTop + lr * (indey - 1)) {
                    inCirle = true;
                }
            }
            return inCirle ? this.target.find("li").eq(indey * 3 + index - 4)[0] : null;
        },
        _addMouseMoveEvent: function () {
            var _this = this;
            _this.target.on("touchmove mousemove", function (e) {
                if (!_this.nineBoxMouseDown || _this.nineBoxMouseUp) return;
                var target = _this.eleTouchMoveIn(e);
                if (target && (target.nodeName == "SPAN" || target.nodeName == "LI")) {//圆环
                    target.nodeName == "SPAN" && (target = target.parentNode);
                    if (target.className == 'ninebox-selected') {
                        return;
                    }
                    _this.moveLine && $(_this.moveLine).remove() && (_this.moveLine = null);
                    $(target).addClass('ninebox-selected').css('border-color', _this.options.lineColor);
                    var from = $(_this.selectedArray[_this.selectedArray.length - 1]);
                    _this._createline(from.position(), $(target).position());
                    from.find("span").css({
                        "backgroundColor": _this.options.lineColor,
                        "borderColor": _this.options.lineColor
                    });
                    $(target).find("span").css({
                        "backgroundColor": _this.options.lineColor,
                        "borderColor": _this.options.lineColor
                    });
                    _this.selectedArray.push(target);
                    return;
                }
                if (_this.options.showMoveLine) {
                    //provisionally fix chrome offsetY
                    if (e.offsetY < _this.options.height / 6) return;
                    var preli = $(_this.selectedArray[_this.selectedArray.length - 1]), offsetX, offsetY;
                    if (e.type != "touchmove") {
                        offsetX = e.offsetX || (e.clientX - target.getBoundingClientRect().left);
                        offsetY = e.offsetY || (e.clientY - target.getBoundingClientRect().top);
                    } else {
                        var x = e.originalEvent.targetTouches[0].pageX,
                            y = e.originalEvent.targetTouches[0].pageY;
                        offsetX = x - _this.target.offset().left;
                        offsetY = y - _this.target.offset().top;
                    }
                    _this._createline(preli.position(), {
                        left: offsetX - 40,
                        top: offsetY - 40
                    }, true);
                }
            });
        }
        ,
        _createline: function (p1, p2, moveLine) {
            var x1 = p1.left, y1 = p1.top, x2 = p2.left, y2 = p2.top;
            var length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)),
                angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            var cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
            x1 = cx - length / 2 + this.options.width / 6;
            y1 = cy - this.options.lineWidth / 2 + this.options.height / 6;
            var transform = "transform:rotate(" + angle + "deg);-webkit-transform:rotate(" + angle
                + "deg);-moz-transform:rotate(" + angle + "deg)";
            var cssText = "border-radius:" + this.options.lineWidth / 2 + "px;position: absolute;" + transform + ";left:" + x1
                + "px;top:" + y1 + "px;width:" + length + "px;height:" + this.options.lineWidth + "px;background:" + this.options.lineColor;
            if (moveLine) {
                this.moveLine || ((this.moveLine = document.createElement("div")) && this.target.append(this.moveLine));
                this.moveLine.style.cssText = cssText;
            } else {
                var linetmtl = document.createElement("div");
                linetmtl.style.cssText = cssText;
                this.lineArray.push(linetmtl);
                this.target.append(linetmtl);
            }
        }
        ,
        removeLine: function () {
            for (var i = 0; i < this.lineArray.length; i++) {
                $(this.lineArray[i]).remove();
            }
            this.lineArray = [];
        }
    };
})(jQuery);