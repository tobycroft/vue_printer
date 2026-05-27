//==本JS是加载Lodop插件或Web打印服务CLodop/Lodop7的综合示例，可直接使用==

var CreatedOKLodopObject, CLodopIsLocal, LoadJsState;

var LODOP_CONFIG = {
    mainJS: "CLodopfuncs.js",
    port1: 8000,
    port2: 18000
};

function setLodopConfig(config) {
    if (config) {
        if (config.mainJS) LODOP_CONFIG.mainJS = config.mainJS;
        if (config.port1) LODOP_CONFIG.port1 = config.port1;
        if (config.port2) LODOP_CONFIG.port2 = config.port2;
        if (config.url) {
            var url = new URL(config.url);
            LODOP_CONFIG.host = url.hostname;
            LODOP_CONFIG.port1 = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
        }
    }
}

function getUrls() {
    var host = LODOP_CONFIG.host || 'localhost';
    var port1 = LODOP_CONFIG.port1 || 8000;
    var port2 = LODOP_CONFIG.port2 || 18000;
    var mainJS = LODOP_CONFIG.mainJS || 'CLodopfuncs.js';
    
    return {
        ws1: `ws://${host}:${port1}/${mainJS}`,
        ws2: `ws://${host}:${port2}/${mainJS}`,
        http1: `http://${host}:${port1}/${mainJS}`,
        http2: `http://${host}:${port2}/${mainJS}`,
        http3: `https://${host}:8443/${mainJS}`
    };
}

function needCLodop() {
    try {
        var ua = navigator.userAgent;
        if (ua.match(/Windows\sPhone/i) ||
            ua.match(/iPhone|iPod|iPad/i) ||
            ua.match(/Android/i) ||
            ua.match(/Edge\D?\d+/i))
            return true;
        var verTrident = ua.match(/Trident\D?\d+/i);
        var verIE = ua.match(/MSIE\D?\d+/i);
        var verOPR = ua.match(/OPR\D?\d+/i);
        var verFF = ua.match(/Firefox\D?\d+/i);
        var x64 = ua.match(/x64/i);
        if ((!verTrident) && (!verIE) && (x64)) return true;
        else if (verFF) {
            verFF = verFF[0].match(/\d+/);
            if ((verFF[0] >= 41) || (x64)) return true;
        } else if (verOPR) {
            verOPR = verOPR[0].match(/\d+/);
            if (verOPR[0] >= 32) return true;
        } else if ((!verTrident) && (!verIE)) {
            var verChrome = ua.match(/Chrome\D?\d+/i);
            if (verChrome) {
                verChrome = verChrome[0].match(/\d+/);
                if (verChrome[0] >= 41) return true;
            }
        }
        return false;
    } catch (err) {
        return true;
    }
}

function checkOrTryHttp() {
    var urls = getUrls();
    if (window.getCLodop) {
        LoadJsState = "complete";
        return true;
    }
    if (LoadJsState == "loadingB" || LoadJsState == "complete") return;
    LoadJsState = "loadingB";
    var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
    var JS1 = document.createElement("script")
       ,JS2 = document.createElement("script")
       ,JS3 = document.createElement("script");
    JS1.src = urls.http1;
    JS2.src = urls.http2;
    JS3.src = urls.http3;
    JS1.onload = JS2.onload = JS3.onload = JS2.onerror = JS3.onerror=function(){LoadJsState = "complete";}
    JS1.onerror = function(e) {
        if (window.location.protocol !== 'https:')
            head.insertBefore(JS2, head.firstChild); else
            head.insertBefore(JS3, head.firstChild);
    }
    head.insertBefore(JS1,head.firstChild);
}

function loadCLodop(callback) {
    if (!needCLodop()) {
        if (callback) callback(null);
        return;
    }
    var urls = getUrls();
    CLodopIsLocal = !!((urls.ws1 + urls.ws2).match(/\/\/localho|\/\/127.0.0./i));
    LoadJsState = "loadingA";
    if (!window.WebSocket && window.MozWebSocket) window.WebSocket=window.MozWebSocket;
    
    var finish = function(err) {
        setTimeout(function() {
            if (callback) callback(err);
        }, 300);
    };
    
    try {
        var WSK1=new WebSocket(urls.ws1);
        WSK1.onopen = function(e) { 
            setTimeout("checkOrTryHttp()", 200); 
            finish(null);
        }
        WSK1.onmessage = function(e) {if (!window.getCLodop) eval(e.data);}
        WSK1.onerror = function(e) {
             var WSK2=new WebSocket(urls.ws2);
             WSK2.onopen = function(e) {
                 setTimeout("checkOrTryHttp()", 200);
                 finish(null);
             }
             WSK2.onmessage = function(e) {if (!window.getCLodop) eval(e.data);}
             WSK2.onerror= function(e) {
                 checkOrTryHttp();
                 finish(null);
             }
        }
    } catch(e){
        checkOrTryHttp();
        finish(null);
    }
}

function getLodop(oOBJECT, oEMBED) {
    var strFontTag = "<br><font color='#FF00FF'>打印控件";
    var strLodopInstall = strFontTag + "未安装!点击这里<a href='install_lodop32.zip' target='_self'>执行安装</a>";
    var strLodopUpdate = strFontTag + "需要升级!点击这里<a href='install_lodop32.zip' target='_self'>执行升级</a>";
    var strLodop64Install = strFontTag + "未安装!点击这里<a href='install_lodop64.zip' target='_self'>执行安装</a>";
    var strLodop64Update = strFontTag + "需要升级!点击这里<a href='install_lodop64.zip' target='_self'>执行升级</a>";
    var strCLodopInstallA = "<br><font color='#FF00FF'>Web打印服务CLodop未安装启动，点击这里<a href='CLodop_Setup_for_Win32NT.zip' target='_self'>下载执行安装</a>";
    var strCLodopInstallB = "<br>（若此前已安装过，可<a href='CLodop.protocol:setup' target='_self'>点这里直接再次启动</a>）";
    var strCLodopUpdate = "<br><font color='#FF00FF'>Web打印服务CLodop需升级!点击这里<a href='CLodop_Setup_for_Win32NT.zip' target='_self'>执行升级</a>";
    var strLodop7FontTag = "<br><font color='#FF00FF'>Web打印服务Lodop7";
    var strLodop7HrefX86 = "点击这里<a href='Lodop7_Linux_X86_64_CN.deb.zip' target='_self'>下载安装</a>(下载后解压，点击lodop文件开始执行)";
    var strLodop7HrefARM = "点击这里<a href='Lodop7_Linux_ARM64_CN.deb.zip'  target='_self'>下载安装</a>(下载后解压，点击lodop文件开始执行)";
    var strLodop7HrefLoongarch = "点击这里<a href='Lodop7_Linux_LoongArch64_CN.deb.zip'  target='_self'>下载安装</a>(下载后解压，点击lodop文件开始执行)";
    var strLodop7Install_X86 = strLodop7FontTag + "未安装启动，" + strLodop7HrefX86;
    var strLodop7Install_ARM = strLodop7FontTag + "未安装启动，" + strLodop7HrefARM;
    var strLodop7Install_Loongarch = strLodop7FontTag + "未安装启动，" + strLodop7HrefLoongarch;
    var strLodop7Update_X86 = strLodop7FontTag + "需升级，" + strLodop7HrefX86;
    var strLodop7Update_ARM = strLodop7FontTag + "需升级，" + strLodop7HrefARM;
     var strLodop7Update_Loongarch = strLodop7FontTag + "需升级，" + strLodop7HrefLoongarch;
    var strInstallOK = "，成功后请刷新本页面或重启浏览器。</font>";
    var LODOP;
    try {
        var isWinIE = (/MSIE/i.test(navigator.userAgent)) || (/Trident/i.test(navigator.userAgent));
        var isWinIE64 = isWinIE && (/x64/i.test(navigator.userAgent));
        var isLinuxX86 = (/Linux/i.test(navigator.platform)) && (/x86/i.test(navigator.platform));
        var isLinuxARM = (/Linux/i.test(navigator.platform)) && (/aarch/i.test(navigator.platform));
        var isLinuxLoongarch = (/Linux/i.test(navigator.platform)) && (/loongarch/i.test(navigator.platform));

        if (needCLodop() || isLinuxX86 || isLinuxARM|| isLinuxLoongarch) {
            try {
                LODOP = window.getCLodop();
            } catch (err) {}
            if (!LODOP && LoadJsState !== "complete") {
                if (!LoadJsState)
                    alert("未曾加载Lodop主JS文件，请先调用loadCLodop过程."); else
                    alert("网页还没下载完毕，请稍等一下再操作.");
                return;
            }
            var strAlertMessage;
            if (!LODOP) {
                if (isLinuxX86)
                    strAlertMessage = strLodop7Install_X86;
                else if (isLinuxARM)
                    strAlertMessage = strLodop7Install_ARM;
                 else if (isLinuxLoongarch)
                    strAlertMessage = strLodop7Install_Loongarch;
                else
                    strAlertMessage = strCLodopInstallA + (CLodopIsLocal ? strCLodopInstallB : "");
                document.body.innerHTML = strAlertMessage + strInstallOK + document.body.innerHTML;
                return;
            } else {
                if (isLinuxX86 && LODOP.CVERSION < "7.1.2.5")
                    strAlertMessage = strLodop7Update_X86;
                else if (isLinuxARM && LODOP.CVERSION < "7.1.2.5")
                    strAlertMessage = strLodop7Update_ARM;
                 else if (isLinuxLoongarch && LODOP.CVERSION < "7.1.2.5")
                    strAlertMessage = strLodop7Update_Loongarch;
                else if (LODOP.CVERSION < "6.6.3.6")
                    strAlertMessage = strCLodopUpdate;

                if (strAlertMessage)
                    document.body.innerHTML = strAlertMessage + strInstallOK + document.body.innerHTML;
            }
        } else {
            if (oOBJECT || oEMBED) {
                if (isWinIE)
                    LODOP = oOBJECT;
                else
                    LODOP = oEMBED;
            } else if (!CreatedOKLodopObject) {
                LODOP = document.createElement("object");
                LODOP.setAttribute("width", 0);
                LODOP.setAttribute("height", 0);
                LODOP.setAttribute("style", "position:absolute;left:0px;top:-100px;width:0px;height:0px;");
                if (isWinIE)
                    LODOP.setAttribute("classid", "clsid:2105C259-1E0C-4534-8141-A753534CB4CA");
                else
                    LODOP.setAttribute("type", "application/x-print-lodop");
                document.documentElement.appendChild(LODOP);
                CreatedOKLodopObject = LODOP;
            } else
                LODOP = CreatedOKLodopObject;
            if ((!LODOP) || (!LODOP.VERSION)) {
                document.body.innerHTML = (isWinIE64 ? strLodop64Install : strLodopInstall) + strInstallOK + document.body.innerHTML;
                return LODOP;
            }
            if (LODOP.VERSION < "6.2.2.6") {
                document.body.innerHTML = (isWinIE64 ? strLodop64Update : strLodopUpdate) + strInstallOK + document.body.innerHTML;
            }
        }
        LODOP.SET_LICENSES("","13528A153BAEE3A0254B9507DCDE2839","EDE92F75B6A3D917F65910","D60BC84D7CF2DE18156A6F88987304CB6D8");
        return LODOP;
    } catch (err) {
        alert("getLodop出错:" + err);
    }
}

export { setLodopConfig, loadCLodop, getLodop, getUrls };