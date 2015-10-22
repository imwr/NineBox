/**
 * @author wr
 * @email mvpjly@163.com
 * @date 2014/10/21
 */
;
(function ($) {
    var defaults = {
        zindex: 100,//九宫格z-index属性
        roundRadii: 25,//圆环半径
        backgroundColor: "#333",//背景色
        color: "#FFFFFF",//圆环颜色
        nineBox: [1, 5, 3],//密码数组
        errorColor: '#FF0000',//解锁失败锁环颜色
        boxTimer: 1000,//错误时清除记录间隔
        lineColor: '#5B8FEF',//线颜色
        lineWidth: 6,//线宽度
        width: 240,//容器宽度
        height: 240,//容器高度
        onError: function () {
        },//密码错误执行的操作
        onSuc: function () {
        }//成功解锁执行的操作
    };
    $.fn.nineBox = function (method) {
        return this.each(function () {
            var ui = $._data(this, "NineBox");
            if (!ui) {
                var opts = $.extend({}, defaults, typeof method == 'object' && method);
                ui = new NineBox(this, opts);
                $._data(this, "NineBox", ui);
            }
            if (typeof method === "string" && typeof ui[method] == "function") {
                ui[method].apply(ui, arguments);
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
            this.ele.css({
                "width": this.options.width,
                "height": this.options.height,
                "backgroundColor": this.options.backgroundColor,
                "zindex": this.options.zindex,
                "-webkitUserDrag": "none"
            }).append(this.buildBox());
            this.lineArray = [];
            this.selectedArray = [];
            this._addMouseDownEvent();
        },
        buildBox: function () {
            if (this.options.width < this.options.roundRadii * 6 || this.options.height < this.options.roundRadii * 6) {
                console.log("圆环半径太大，容器装不下了~");
                return;
            }
            var temp = $(document.createDocumentFragment());
            var imargin = this.options.roundRadii - this.options.pointRadii - 3;
            for (var i = 0; i < 9; i++) {
                var dbox = $(document.createElement("li")).css({
                    cursor: "pointer",
                    margin: this.options.width / 6 - this.options.roundRadii,
                    float: "left",
                    listStyleType: "none",
                    width: this.options.roundRadii * 2,
                    borderRadius: this.options.roundRadii,
                    height: this.options.roundRadii * 2,
                    position: "relative",
                    border: "2px solid " + this.options.color,
                    boxSizing: "border-box"
                });
                var ibox = $(document.createElement("span")).css({
                    border: "1px solid " + this.options.color,
                    width: this.options.pointRadii * 2,
                    height: this.options.pointRadii * 2,
                    borderRadius: this.options.pointRadii,
                    position: "absolute",
                    top: imargin,
                    left: imargin
                });
                temp.append(dbox.append(ibox));
            }
            return temp.append("<div style='clear:left'></div>");
        },
        _addMouseDownEvent: function () {
            var _this = this;
            _this.ele.on("mousedown", "li", function () {
                if (!_this.nineBoxMouseDown) {
                    _this.nineBoxMouseDown = true;
                    $(this).addClass('ninebox-selected').css('border-color', _this.options.lineColor).find("span").
                        css("border-color", _this.options.lineColor);
                    _this.selectedArray = [];
                    _this.selectedArray.push(this);
                    _this._addMouseOverEvent();
                    _this._addMouseUpEvent();
                }
            });
        },
        _addMouseUpEvent: function () {
            var _this = this;
            $(this.ele).on("mouseup", function () {
                if (_this.selectedArray.length == 0) {
                    return;
                }
                var lis = _this.ele.find("li"), pwd = [];
                for (var i = 0; i < _this.selectedArray.length; i++) {
                    pwd.push(lis.index(_this.selectedArray[i]));
                }
                if (_this.options.nineBox.toString() == pwd.toString()) { //如果成功解锁
                    if (typeof _this.options.onSuc == "function") {
                        _this.options.onSuc();
                    }
                    _this.removeLine();
                    for (var i = 0; i < _this.selectedArray.length; i++) {
                        $(_this.selectedArray[i]).removClass('ninebox-selected')
                            .css("border-color", _this.options.color).find("span").css({
                                "background": "none",
                                "borderColor": _this.options.color
                            });
                    }
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
                _this.ele.off("mouseup");
                _this.ele.off("mouseover");
            });
        },
        _addMouseOverEvent: function () {
            var _this = this;
            _this.ele.on("mouseover", "li", function () {
                var _subthis = this;
                if (!_this.nineBoxMouseDown || $(_subthis).hasClass('ninebox-selected')) {
                    return;
                }
                $(_subthis).addClass('ninebox-selected').css('border-color', _this.options.lineColor);
                _this.selectedArray.push(_subthis);
                _this._createline($(_this.selectedArray[_this.selectedArray.length - 2]), $(_subthis));
            });
        },
        _createline: function (from, to) {
            this.isIE = !$.support.leadingWhitespace;
            this.p1 = from.position();
            this.p2 = to.position();

            var x1 = this.p1.left, y1 = this.p1.top, x2 = this.p2.left, y2 = this.p2.top;
            var length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)),
                angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            //修正偏转导致的偏移 inexactitude
            if (angle == 90) {//上下
                x1 = x1 - this.options.lineWidth / 2;
                y1 = y1 - this.options.lineWidth / 2;
            } else if (angle == 180) { //右左
                x1 = x1 - this.options.lineWidth / 2;
                y1 = y1 - this.options.lineWidth * 3 / 2;
            } else if (angle == -90) {   //下上
                x1 = x1 + this.options.lineWidth / 2;
                y1 = y1 - this.options.lineWidth * 3 / 2;
            } else if (angle == 0) {   //左右
                x1 = x1 + this.options.lineWidth / 2;
                y1 = y1 - this.options.lineWidth / 2;
            } else if (angle < -90) {
                // x1 = x1;
                y1 = y1 - this.options.lineWidth * 3 / 2;
            } else if (angle > -90 && angle < 0) {
                x1 = x1 + this.options.lineWidth;
                y1 = y1 - this.options.lineWidth;
            } else if (angle > 90 && angle < 180) {
                x1 = x1 - this.options.lineWidth / 2;
                y1 = y1 - this.options.lineWidth;
            } else {
                x1 = x1 - this.options.lineWidth / 2;
                y1 = y1 - this.options.lineWidth;
            }
            x1 += this.options.width / 6;
            y1 += this.options.width / 6;
            var transform = "";
            if (this.isIE) {
                transform = "filter:progid:DXImageTransform.Microsoft.Matrix(M11=" + Math.cos(angle) +
                    ",M12=" + -1 * Math.sin(angle) + ",M21=" + Math.sin(angle) + ",M22=" + Math.cos(angle) +
                    ",SizingMethod='auto expand');overflow:auto;";
            } else {
                transform += "transform:rotate(" + angle + "deg);-webkit-transform:rotate(" + angle
                    + "deg);-moz-transform:rotate(" + angle + "deg);";
            }
            var linetmtl = document.createElement("div");
            linetmtl.className = "ninebox-line";
            linetmtl.style.cssText = "box-sizing:border-box;position: absolute;" + transform + "left:" + x1 + "px;top:" +
                y1 + "px;width:" + length + "px;-webkit-transform-origin: 0 100%;-moz-transform-origin: 0 100%;" +
                "transform-origin: 0 100%;height:" + this.options.lineWidth + "px;background:" + this.options.lineColor + ";";
            this.lineArray.push(linetmtl);
            this.ele.append(linetmtl);
            from.find("span").css({
                "backgroundColor": this.options.lineColor,
                "borderColor": this.options.lineColor
            });
            to.find("span").css({
                "backgroundColor": this.options.lineColor,
                "borderColor": this.options.lineColor
            });
        },
        removeLine: function () {
            for (var i = 0; i < this.lineArray.length; i++) {
                $(this.lineArray[i]).remove();
            }
            this.lineArray = [];
        }
    };
})(jQuery);