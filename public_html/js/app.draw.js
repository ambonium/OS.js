/**
 * Application: Draw
 *
 * http://hacks.mozilla.org/2009/06/pushing-pixels-with-canvas/
 * http://beej.us/blog/2010/02/html5s-canvas-part-ii-pixel-manipulation/
 * https://developer.mozilla.org/En/Canvas_tutorial/Applying_styles_and_colors
 *
 * @package ajwm.Applications
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @class
 */
var ApplicationDraw = (function($, undefined) {


  // Get the mouse position relative to the canvas element.
  function mouseposX(ev) {
    var x;
    if (ev.layerX || ev.layerX === 0) { // Firefox
      x = ev.layerX;
    } else if (ev.offsetX || ev.offsetX === 0) { // Opera
      x = ev.offsetX;
    }
    return x;
  }

  // Get the mouse position relative to the canvas element.
  function mouseposY(ev) {
    var y;
    if (ev.layerX || ev.layerX === 0) { // Firefox
      y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX === 0) { // Opera
      y = ev.offsetY;
    }
    return y;
  }

  return function(Application, app, api, argv) {


    var startPosX = 0;
    var startPosY = 0;
    var useFill = true;
    var oldBrush = null;

    Tools = {

      'pencil' : {
        mousedown : function(ev, context, canvas) {
          context.beginPath();
          context.moveTo(mouseposX(ev), mouseposY(ev));
        },

        mousemove : function(ev, context, canvas) {
          context.lineTo(mouseposX(ev), mouseposY(ev));
          context.stroke();
        },

        mouseup : function(ev, context, canvas) {

        }
      },

      'brush' : {
        mousedown : function(ev, context, canvas) {
          api.ui.cursor('crosshair');
          oldBrush = context.strokeStyle;

          var img = new Image();
          img.onload = function() {
            context.strokeStyle = context.createPattern(img, 'repeat');
          };
          img.src = "/img/app.draw/icons/stock-controller-linux-input-16.png";
          context.beginPath();
        },
        mousemove : function(ev, context, canvas) {
          context.lineTo(mouseposX(ev), mouseposY(ev));
          context.stroke();
        },
        mouseup : function(ev, context, canvas) {
          api.ui.cursor('default');
          context.strokeStyle = oldBrush;
        }
      },

      'line' : {
        mousedown : function(ev, context, canvas) {
          api.ui.cursor('crosshair');
        },
        mousemove : function(ev, context, canvas) {
          context.beginPath();
          context.moveTo(startPosX, startPosY);
          context.lineTo(mouseposX(ev), mouseposY(ev));
          context.stroke();
          context.closePath();

        },
        mouseup : function(ev, context, canvas) {
          api.ui.cursor('default');
        }
      },

      'rectangle' : {
        mousedown : function(ev, context, canvas) {
          api.ui.cursor('all-scroll');
        },
        mousemove : function(ev, context, canvas) {
          var mX = mouseposX(ev);
          var mY = mouseposY(ev);
          var x = Math.min(mX, startPosX);
          var y = Math.min(mY, startPosY);
          var w = Math.abs(mX - startPosX);
          var h = Math.abs(mY - startPosY);

          if (!w || !h) {
            return;
          }

          context.strokeRect(x, y, w, h);
          if ( useFill ) {
            context.fillRect(x, y, w, h);
          }
        },
        mouseup : function(ev, context, canvas) {
          api.ui.cursor('default');
        }
      },

      'circle' : {
        mousedown : function(ev, context, canvas) {
          api.ui.cursor('move');
        },
        mousemove : function(ev, context, canvas) {
          var mX = mouseposX(ev);
          var mY = mouseposY(ev);
          var posX = Math.abs(startPosX - mX);
          var posY = Math.abs(startPosY - mY);

          var r = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));

          if ( r > 0 ) {
            context.beginPath();
            context.arc(startPosX,startPosY,r,0,Math.PI*2,true);
            context.closePath();
            context.stroke();

            if ( useFill ) {
              context.fill();
            }
          }

        },
        mouseup : function(ev, context, canvas) {
          api.ui.cursor('default');
        }
      },

      'fill' : {
        mousedown : function(ev, context, canvas) {
        },
        mousemove : function(ev, context, canvas) {
        },
        mouseup : function(ev, context, canvas) {
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

    };



    var _ApplicationDraw = Application.extend({
      init : function() {
        this._super("ApplicationDraw");
      },

      destroy : function() {
        this._super();
      },

      run : function() {
        var el = app.$element;
        var self = this;

        var loaded   = false;
        var canvaso  = el.find("canvas").get(0);
        var contexto = canvaso.getContext('2d');
        var canvas   = $(canvaso).parent().append("<canvas></canvas>").find("canvas").get(1);
        var context  = canvas.getContext('2d');

        var isDrawing       = false;
        var currentTool     = null;
        var currentToolText = null;
        var currentToolObj  = null;

        var _updateTools = function() {
          context.strokeStyle = $(el).find(".color_Foreground").css("background-color");
          context.fillStyle   = $(el).find(".color_Background").css("background-color");
          context.lineWidth   = $(el).find(".slide_Thickness").slider("value");
          context.lineCap     = $(el).find(".select_LineCap").val();
          context.lineJoin    = $(el).find(".select_LineJoin").val();
        };

        app.resize_hook = function() {
          var oldImage;
          if ( loaded ) {
            oldImage = canvaso.toDataURL("image/png");
          }

          canvas.width        = $(el).find(".WindowContent").width();
          canvas.height       = $(el).find(".WindowContent").height();
          canvaso.width       = canvas.width;
          canvaso.height      = canvas.height;

          _updateTools();

          if ( oldImage ) {
            var img = new Image();
            img.onload = function() {
              contexto.drawImage(img, 0, 0);
            };
            img.src = oldImage;
          }
        };
        app.resize_hook();
        loaded = true;

        function _save(file, content, callback) {
          callback = callback || function() {};

          if ( typeof file == "string" && file ) {
            api.system.call("write", {'file' : file, 'content' : content, 'encoding' : 'data:image/png;base64'}, function(result, error) {
              // SYSTEM HANDLES ERRORS
              if ( result ) {
                callback(file);
              }
            });
          }
        }

        function _saveAs(callback) {
          api.system.dialog_file(function(file, mime) {
            callback(file, mime);
          }, ["image/*"], "save");
        }

        function _open(callback) {
          api.system.dialog_file(function(fname) {
            callback(fname);
          }, ["image/*"]);
        }

        function _update(file, el) {
          app.opts = file;
          argv['path'] = file;

          $(el).find(".WindowTopInner span").html(app.title + ": " + (file || "New file"));
        }





        $(canvas).css({
          "position" : "absolute",
          "top"      : "0px",
          "left"     : "0px"
        });

        $(canvas).mousedown(function(ev) {
          if ( !isDrawing ) {
            isDrawing = true;

            startPosX = mouseposX(ev);
            startPosY = mouseposY(ev);

            api.ui.cursor("pointer");

            currentToolObj.mousedown(ev, context, canvas);

            ev.preventDefault();
          }
        }).mousemove(function(ev) {
          if ( isDrawing ) {
            context.clearRect(0, 0, canvas.width, canvas.height);

            currentToolObj.mousemove(ev, context, canvas);
            //ev.preventDefault();
          }
        }).mouseup(function(ev) {
          if ( isDrawing ) {
            currentToolObj.mouseup(ev, context, canvas);

            contexto.drawImage(canvas, 0, 0);
            context.clearRect(0, 0, canvas.width, canvas.height);

            api.ui.cursor("default");

            isDrawing = false;

            ev.preventDefault();
          }

        }).click(function(ev) {
          if ( currentToolObj && currentToolObj.click ) {
            currentToolObj.click(ev, context, canvas);
          }
        });

        $(el).find("canvas").bind("contextmenu",function(e) {
          return false;
        });

        // Tool buttons

        $(el).find(".ApplicationDrawPanel button").click(function() {
          if ( $(this)[0] != $(currentTool)[0] ) {
            if ( currentTool !== null ) {
              $(currentTool).removeClass("Current");
            }

            currentTool = this;
            currentToolText = $(currentTool).attr("class").replace("draw_", "");
            currentToolObj = Tools[currentToolText.toLowerCase()];

            $(this).addClass("Current");
          }
        });

        $($(el).find(".ApplicationDrawPanel button").get(0)).click();

        $(el).find(".color_Foreground").click(function() {
          //var color = '#'+Math.floor(Math.random()*16777215).toString(16);

          api.system.dialog_color(context.strokeStyle, function(rgb, hex) {
            $(el).find(".color_Foreground").css("background-color", hex);
            context.strokeStyle = hex;
          });
        });

        $(el).find(".color_Background").click(function() {
          //var color = '#'+Math.floor(Math.random()*16777215).toString(16);

          api.system.dialog_color(context.fillStyle, function(rgb, hex) {
            $(el).find(".color_Background").css("background-color", hex);
            context.fillStyle = hex;
          });
        });

        $(el).find(".enable_Fill").click(function() {
          useFill = this.checked ? true : false;
        });

        $(el).find(".slide_Thickness").slider({
          'min' : 1,
          'max' : 50,
          'value' : 1,
          'step' : 1,
          'change' : function() {
            context.lineWidth = $(el).find(".slide_Thickness").slider("value");
          },
          'slide' : function() {
            context.lineWidth = $(el).find(".slide_Thickness").slider("value");
          }
        });

        $(el).find(".select_LineCap").change(function() {
          context.lineCap = $(el).find(".select_LineCap").val();
        });
        $(el).find(".select_LineJoin").change(function() {
          context.lineJoin = $(el).find(".select_LineJoin").val();
        });


        // Menu items
        app.setMenuItemAction("File", "cmd_Open", function() {
          _open(function(fname) {
            context.clearRect (0, 0, canvas.width, canvas.height);
            contexto.clearRect (0, 0, canvas.width, canvas.height);

            var img = new Image();
            img.onload = function() {
              canvas.width = img.width;
              canvas.height = img.height;
              canvaso.width = img.width;
              canvaso.height = img.height;
              context.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = "/media/" + fname;

            _update(fname, el);
          });
        });

        app.setMenuItemAction("File", "cmd_Save", function() {
          if ( argv && argv['path'] ) {
            var img = canvaso.toDataURL("image/png");
            _save(argv['path'], img);
          }
        });

        app.setMenuItemAction("File", "cmd_SaveAs", function() {
          var img = canvaso.toDataURL("image/png");
          _saveAs(function(file, mime) {
            _save(file, img, function() {
              _update(file, el);
            });
          });
        });

        app.setMenuItemAction("File", "cmd_New", function() {
          app.$element.find("textarea").val("");
          context.clearRect (0, 0, canvas.width, canvas.height);
          contexto.clearRect (0, 0, canvas.width, canvas.height);
          _update(null, el);
        });

        this._super();

        _update(null, el);
      }
    });

    return new _ApplicationDraw();
  };
})($);
