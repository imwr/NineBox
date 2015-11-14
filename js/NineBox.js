/**
 * @author wr
 * @email mvpjly@163.com
 * @date 2014/10/21
 */
;
(function ($) {
    var defaults = {
        showMoveLine: true,//是否显示鼠标移动路径
        mode: "css3",// 渲染方式，css3 || canvas
        zindex: 100,//九宫格z-index属性
        radius: 25,//圆环半径
        backgroundColor: "#333",//背景色
        color: "#FFFFFF",//圆环颜色
        pwd: "123",//密码数组
        errorColor: '#FF0000',//解锁失败锁环颜色
        boxTimer: 1000,//错误时清除记录间隔
        lineColor: '#5B8FEF',//线颜色
        lineWidth: 8,//线宽度
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
                if ($.support.leadingWhitespace) {
                    if (opts.mode == "css3") {
                        var style = document.createElement("div").style;
                        var css = ["transform", "WebkitTransform", "MozTransform", "msTransform", "OTransform"];
                        for (var i in css) {
                            if (typeof  style[css[i]] != "undefined") {
                                ui = new NineBox(this, opts);
                                break;
                            }
                        }
                    } else if (opts.mode == "canvas" && "getContext" in document.createElement('canvas')) {
                        ui = new CavasNineBox(this, opts);
                    }
                    $._data(this, "NineBox", ui);
                } else { //ie6-8
                    console.log("mode is not support ! ie mode is development ~")
                }
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
            });
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
                if (_this.options.pwd.toString() == pwd) { //如果成功解锁
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
                //_this.ele.off("mouseup touchend");
                //_this.ele.off("mousemove touchmove");
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
                    var preli = $(_this.selectedArray[_this.selectedArray.length - 1]), offsetX, offsetY
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

    var CavasNineBox = function (element, options) {
        this.$element = $(element);
        this.options = options;
        var that = this;
        this.pr = this.options.lineWidth / 3;
        this.rr = options.radius;
        this.o = (options.width / 6 - options.radius) * 2;
        this.oy = (options.height / 6 - options.radius) * 2;
        this.color = options.color;
        //全局样式
        this.$element.css({
            "position": "relation",
            "width": this.options.width,
            "height": this.options.height,
            "background-color": options.backgroundColor,
            "overflow": "hidden",
            "cursor": "default"
        });

        //选择器规范
        if (!$(element).attr("id"))
            $(element).attr("id", (Math.random() * 65535).toString());
        this.id = "#" + $(element).attr("id");

        var Point = function (x, y) {
            this.x = x;
            this.y = y
        };

        this.result = "";
        this.pList = [];
        this.sList = [];
        this.tP = new Point(0, 0);

        this.$element.append('<canvas class="main-c" width="' + options.width + '" height="' + options.height + '" >');
        this.$c = $(this.id + " .main-c")[0];
        this.$ctx = this.$c.getContext('2d');

        this.initDraw = function () {
            this.$ctx.strokeStyle = this.color;
            this.$ctx.lineWidth = 2;
            for (var j = 0; j < 3; j++) {
                for (var i = 0; i < 3; i++) {
                    this.$ctx.moveTo(this.o / 2 + this.rr * 2 + i * (this.o + 2 * this.rr), this.oy / 2
                        + this.rr + j * (this.oy + 2 * this.rr));
                    this.$ctx.arc(this.o / 2 + this.rr + i * (this.o + 2 * this.rr), this.oy / 2 +
                        this.rr + j * (this.oy + 2 * this.rr), this.rr, 0, 2 * Math.PI);
                    var tem = new Point(this.o / 2 + this.rr + i * (this.o + 2 * this.rr), this.oy / 2
                        + this.rr + j * (this.oy + 2 * this.rr));
                    if (that.pList.length < 9)
                        this.pList.push(tem);
                }
            }
            this.$ctx.stroke();
            this.initImg = this.$ctx.getImageData(0, 0, this.options.width, this.options.height);
        };
        this.initDraw();
        this.isIn = function (x, y) {
            for (var p in that.pList) {
                if (( Math.pow((x - that.pList[p]["x"]), 2) + Math.pow((y - that.pList[p]["y"]), 2) ) < Math.pow(this.rr, 2)) {
                    return that.pList[p];
                }
            }
            return 0;
        };

        this.pointDraw = function (c) {
            if (arguments.length > 0) {
                that.$ctx.strokeStyle = c;
                that.$ctx.fillStyle = c;
            }
            for (var p in that.sList) {
                that.$ctx.moveTo(that.sList[p]["x"] + that.pr, that.sList[p]["y"]);
                that.$ctx.arc(that.sList[p]["x"], that.sList[p]["y"], that.pr, 0, 2 * Math.PI);
                that.$ctx.fill();
            }
        };
        this.lineDraw = function (c) {
            if (arguments.length > 0) {
                that.$ctx.strokeStyle = c;
                that.$ctx.fillStyle = c;
                that.$ctx.lineWidth = that.options.lineWidth;
            }
            if (that.sList.length > 0) {
                for (var p in that.sList) {
                    if (p == 0) {
                        that.$ctx.moveTo(that.sList[p]["x"], that.sList[p]["y"]);
                        continue;
                    }
                    that.$ctx.lineTo(that.sList[p]["x"], that.sList[p]["y"]);
                }
            }
        };

        this.allDraw = function (c) {
            if (arguments.length > 0) {
                this.pointDraw(c);
                this.lineDraw(c);
                that.$ctx.stroke();
            } else {
                this.pointDraw();
                this.lineDraw();
            }
        };

        this.draw = function (x, y) {
            that.$ctx.clearRect(0, 0, that.options.width, that.options.height);
            that.$ctx.beginPath();
            that.$ctx.putImageData(this.initImg, 0, 0);
            that.pointDraw(that.options.lineColor);
            that.lineDraw(that.options.lineColor);
            that.$ctx.lineTo(x, y);
            that.$ctx.stroke();
        };

        this.pointInList = function (poi, list) {
            for (var p in list) {
                if (poi["x"] == list[p]["x"] && poi["y"] == list[p]["y"]) {
                    return ++p;
                }
            }
            return false;
        };

        this.touched = false;
        $(this.id).on("mousedown touchstart", {that: that}, function (e) {
            e.data.that.touched = true;
        });
        $(this.id).on("mouseup touchend", {that: that}, function (e) {
            e.data.that.touched = false;
            that.$ctx.clearRect(0, 0, that.options.width, that.options.height);
            that.$ctx.beginPath();
            that.$ctx.putImageData(e.data.that.initImg, 0, 0);
            that.allDraw(that.options.lineColor);
            for (var p in that.sList) {
                if (e.data.that.pointInList(that.sList[p], e.data.that.pList)) {
                    e.data.that.result = e.data.that.result + (e.data.that.pointInList(that.sList[p], e.data.that.pList)).toString();
                }
            }

            if (that.result == that.options.pwd) {
                if (typeof that.options.onSuc == "function") {
                    that.options.onSuc();
                }
                that.result = "";
                that.pList = [];
                that.sList = [];
                that.$ctx.clearRect(0, 0, that.options.width, that.options.height);
                that.$ctx.beginPath();
                that.initDraw();
            } else {
                if (typeof that.options.onError == "function") {
                    that.options.onError();
                }
                that.$ctx.clearRect(0, 0, that.options.width, that.options.height);
                that.$ctx.beginPath();
                that.$ctx.putImageData(that.initImg, 0, 0);
                that.allDraw(that.options.errorColor);
                that.result = "";
                that.pList = [];
                that.sList = [];
                setTimeout(function () {
                    that.$ctx.clearRect(0, 0, that.options.width, that.options.height);
                    that.$ctx.beginPath();
                    that.initDraw()
                }, that.options.boxTimer)
            }
        });

        $(document).on("touchmove mousemove", {that: that}, function (e) {
            return !e.data.that.touched;
        });

        $(this.id).on('touchmove mousemove', {that: that}, function (e) {
            if (e.data.that.touched) {
                var x = e.pageX || e.originalEvent.targetTouches[0].pageX;
                var y = e.pageY || e.originalEvent.targetTouches[0].pageY;
                x = x - that.$element.offset().left;
                y = y - that.$element.offset().top;
                var p = e.data.that.isIn(x, y);
                if (p != 0) {
                    if (!e.data.that.pointInList(p, e.data.that.sList)) {
                        e.data.that.sList.push(p);
                    }
                }
                e.data.that.draw(x, y);
            }
        });
    };
})(jQuery);