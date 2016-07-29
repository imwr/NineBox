/* =========================================================== *
 * @site http://tt-cc.cc
 * @email ttccmvp@gmail.com
 * Copyright 2016 ttcc
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
        lineWidth: 8,//线宽度
        width: 240,//容器宽度
        height: 240,//容器高度
        onError: function () {
        },//密码错误执行的操作
        onSuc: function () {
        }//成功解锁执行的操作
    };
    $.fn.nineBoxCanvas = function (method) {
        var arg = arguments;
        return this.each(function () {
            var ui = $._data(this, "NineBoxCanvas");
            if (!ui) {
                var opts = $.extend({}, defaults, typeof method == 'object' && method);
                if ($.support.leadingWhitespace) {
                    if ("getContext" in document.createElement('canvas')) {
                        ui = new CavasNineBox(this, opts);
                    }
                    $._data(this, "NineBoxCanvas", ui);
                } else { //ie6-8
                    console.log("mode is not support ! ie mode is development ~")
                }
            }
            if (typeof method === "string" && typeof ui[method] == "function") {
                ui[method].apply(ui, Array.prototype.slice.call(args, 1));
            }
        });
    };
    var CavasNineBox = function (element, options) {
        if (options.encrypt && !window.CryptoJS) {
            return alert("Please import box.encrypt.js to encrypt pwd");
        }
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
            if (that.options.pwd == (that.options.encrypt ? CryptoJS.SHA3(that.result).toString() : that.result)) {
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