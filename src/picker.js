const {desktopCapturer, ipcRenderer} = require('electron')
const domify = require('domify')
var seltdWinInfos = []
document.onkeydown = function (evt) {
    evt = evt || window.event
    // Press esc key.
    if (evt.keyCode === 27) {
        ipcRenderer.send('source-id-selected', null)
    }
}
$(document).ready(function () {
    //确认按钮,存在于页面之中,仅绑定一次click事件即可
    $('#confirm').click(() => {
        if (!seltdWinInfos || seltdWinInfos.length < 1) {
            //alert('Please select at least one window!');
            return;
        }
        //alert(seltdWinInfos);
        ipcRenderer.send('source-id-selected', seltdWinInfos)
        //sourcesList.innerHTML = ''
    });
});


ipcRenderer.on('get-sources', (event, options) => {
    seltdWinInfos = []
    //$('li').remove()
    $('.capturer-list').html('');//清空里层所有html
    desktopCapturer.getSources(options).then(async sources => {
        let sourcesList = document.querySelector('.capturer-list')
        for (let source of sources) {
            let thumb = source.thumbnail.toDataURL()
            if (!thumb) continue
            let title = source.name.slice(0, 20)
            let id = source.id
            let item = `
                         <li id="${id}">
                           <a class="pointbox" href="#">
                             <img src="${thumb}"/>
                             <span>${title}</span>
                             audio devcie name:<input type="text" name="adn"></input><br/>
                             rtmp server url:<input type="text" name="rsu"></input>
                           </a>
                         </li>
            `
            sourcesList.appendChild(domify(item))
        }
        let links = sourcesList.querySelectorAll('a')
        //let but = sourcesList.querySelectorAll('button')
        $(links).click(function (e) {
            if ($(this).parent().hasClass("change_color")) {
                $(this).parent().removeClass("change_color");
            } else {
                $(this).parent().addClass("change_color");
            }
            let list = sourcesList.querySelectorAll('.change_color')
            seltdWinInfos = [];
            $(list).each((idx, ele) => {
                //新增参数信息,字符串拼接
                let winInfo = $(ele).attr('id') + '|' + $(ele).find("input[name='adn']").val() + '|' + $(ele).find("input[name='rsu']").val();
                seltdWinInfos.push(winInfo);
            });
            //seltdWinIds.push($(list).attr('id'))
            console.log(list)
            console.log(seltdWinInfos)
            //need add this line
            e.preventDefault()
        });
    })
})
