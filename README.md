# ChromeLiveStream（[English introduction](https://github.com/xiaohero/ChromeLiveStream/blob/master/README.en.md)） (基于electron+ffmpeg的网页录屏录音及直播流项目)

#### 介绍
* ChromeLiveStream是一个基于electron+ffmpeg的网页录屏录音,它是基于[electron-screen-recorder](https://github.com/hokein/electron-screen-recorder)开发.
* 其主要功能，包括如下:
  * 支持浏览器网页及运行中的任意窗口的实时视频录制.
  * 支持摄像头录屏,系统录屏.
  * 支持网页窗口的音频实时录制.
  * 支持录制的视频，音频数据流的转码(通过ffmpeg转码)
  * 支持录制视频转rtmp直播流在线播放(需自己搭建rtmp流服务器)
  * 支持录制视频的实时预览播放，下载保存
  * 特有增强功能:
    * 支持同时录制多个窗口音视频,并且分离音频录制.
    * 支持网页端,不同网页的视频及音频分离录制技术(历经各种困难尝试,谷歌技术搜索，终于完成)
      * 比如浏览器同时打开了2个视频网站:A网站播放a视频，B网站播放b视频，此工具可以同时录制a，b两视频，并且分离a，b它们的音频使其分别独立录制(一般情况我们同时播放两个网站视频的时候,音频肯定会混淆，会重叠)
      * 分离不同的网页音频，无需依赖多个声卡插入,我们通过软件模拟"虚拟声卡技术"(比如[VB-Cable](https://vb-audio.com/Cable/)) 它可以创建多个虚拟声卡.


#### 软件架构及原理
* ChromeLiveStream运行的时候借助electron读取当前系统运行中的所有窗口句柄,供选择.
* ChromeLiveStream会加载AudioPick谷歌扩展(可以让用户根据不同网页窗口的音频输出到不同的音频设备).
* 用户选择指定窗口后,调用h5录屏api开启视频流的录制,同时调用h5的音频读取接口获取当前操作系统的所有输出音频设备.
* 当用户选择多个窗口同时录制视频及音频时,通过AudioPick配合分离不同网页输出到不同音频设备(虚拟音频),达到分离音频录制效果.


#### 安装及使用教程
* npm install
* npm start
