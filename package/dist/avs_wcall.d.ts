import { UserMediaHandler, MediaStreamHandler } from "./avs_pc.js";
export declare enum LOG_LEVEL {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare enum CONV_TYPE {
    ONEONONE = 0,
    GROUP = 1,
    CONFERENCE = 2
}
export declare enum STATE {
    NONE = 0,
    OUTGOING = 1,
    INCOMING = 2,
    ANSWERED = 3,
    MEDIA_ESTAB = 4,
    TERM_LOCAL = 6,
    TERM_REMOTE = 7,
    UNKNOWN = 8
}
export declare enum REASON {
    NORMAL = 0,
    ERROR = 1,
    TIMEOUT = 2,
    LOST_MEDIA = 3,
    CANCELED = 4,
    ANSWERED_ELSEWHERE = 5,
    IO_ERROR = 6,
    STILL_ONGOING = 7,
    TIMEOUT_ECONN = 8,
    DATACHANNEL = 9,
    REJECTED = 10
}
export declare enum VIDEO_STATE {
    STOPPED = 0,
    STARTED = 1,
    BAD_CONN = 2,
    PAUSED = 3,
    SCREENSHARE = 4
}
export declare enum ENV {
    DEFAULT = 0,
    FIREFOX = 1
}
export declare enum ERROR {
    NO_MEMORY = 12,
    INVALID = 22,
    TIMED_OUT = 110,
    ALREADY = 114,
    UNKNOWN_PROTOCOL = 1000
}
export declare enum CALL_TYPE {
    NORMAL = 0,
    VIDEO = 1,
    FORCED_AUDIO = 2
}
export declare enum QUALITY {
    NORMAL = 1,
    MEDIUM = 2,
    POOR = 3
}
export declare type WcallReadyHandler = (version: number, arg: number) => void;
export declare type WcallShutdownHandler = (wuser: number, arg: number) => void;
export declare type WcallSendHandler = (ctx: number, convid: string, userid_self: string, clientid_self: string, userid_dest: string, clientid_dest: string, data: string, len: number, trans: number, arg: number) => number;
export declare type WcallSftReqHandler = (ctx: number, url: string, data: string, len: number, arg: number) => number;
export declare type WcallIncomingHandler = (convid: string, msg_time: number, userid: string, video_call: number, should_ring: number, arg: number) => void;
export declare type WcallMissedHandler = (convid: string, msg_time: number, userid: string, video_call: number, arg: number) => void;
export declare type WcallNetworkQualityHandler = (convid: string, userid: string, quality: number, rtt: number, uploss: number, downloss: number, arg: number) => void;
export declare type WcallAnsweredHandler = (convid: string, arg: number) => void;
export declare type WcallEstabHandler = (convid: string, userid: string, arg: number) => void;
export declare type WcallGroupChangedHandler = (convid: string, arg: number) => void;
export declare type WcallParticipantChangedHandler = (convid: string, mjson: string, arg: number) => void;
export declare type WcallMediaEstabHandler = (convid: string, peer: number, userid: string, arg: number) => void;
export declare type WcallMediaStoppedHandler = (convid: string, arg: number) => void;
export declare type WcallDataChanEstabHandler = (convid: string, userid: string, arg: number) => void;
export declare type WcallMuteHandler = (muted: number, arg: number) => void;
export declare type WcallCloseHandler = (reason: number, convid: string, msg_time: number, userid: string, arg: number) => void;
export declare type WcallMetricsHandler = (convid: string, metrics_json: string, arg: number) => void;
export declare type WcallLogHandler = (level: number, msg: string, arg: number) => void;
export declare type WcallVideoStateChangeHandler = (convid: string, userid: string, clientid: string, state: number, arg: number) => void;
export declare type WcallVideoSizeHandler = (w: number, h: number, userid: string, arg: number) => void;
export declare type WcallAudioCbrChangeHandler = (userid: string, enabled: number, arg: number) => void;
export declare type WcallConfigReqHandler = (wuser: number, arg: number) => number;
export declare type WcallStateChangeHandler = (convid: string, state: number, arg: number) => void;
export declare type WcallReqClientsHandler = (convid: string, arg: number) => void;
export declare type WcallNetprobeHandler = (err: number, rtt_avg: number, n_pkt_sent: number, n_pkt_recv: number, arg: number) => void;
export declare class Wcall {
    private em_module;
    constructor(em_module: any);
    init(env: number): number;
    close(): void;
    create(userid: string, clientid: string, readyh: WcallReadyHandler, sendh: WcallSendHandler, incomingh: WcallIncomingHandler, missedh: WcallMissedHandler, answerh: WcallAnsweredHandler, estabh: WcallEstabHandler, closeh: WcallCloseHandler, metricsh: WcallMetricsHandler, cfg_reqh: WcallConfigReqHandler, acbrh: WcallAudioCbrChangeHandler, vstateh: WcallVideoStateChangeHandler, arg?: number): number;
    createEx(userid: string, clientid: string, use_mediamgr: number, msys_name: string, readyh: WcallReadyHandler, sendh: WcallSendHandler, sfth: WcallSftReqHandler, incomingh: WcallIncomingHandler, missedh: WcallMissedHandler, answerh: WcallAnsweredHandler, estabh: WcallEstabHandler, closeh: WcallCloseHandler, metricsh: WcallMetricsHandler, cfg_reqh: WcallConfigReqHandler, acbrh: WcallAudioCbrChangeHandler, vstateh: WcallVideoStateChangeHandler, arg?: number): number;
    setShutdownHandler(wuser: number, shuth: WcallShutdownHandler, arg?: number): void;
    destroy(wuser: number): void;
    setTrace(wuser: number, trace: number): void;
    start(wuser: number, convid: string, call_type: number, conv_type: number, audio_cbr: number): number;
    startEx(wuser: number, convid: string, sft_url: string, sft_token: string, call_type: number, conv_type: number, audio_cbr: number, extcodec_arg: number): number;
    confStart(wuser: number, convid: string, sft_url: string, sft_token: string, call_type: number, audio_cbr: number): number;
    answer(wuser: number, convid: string, call_type: number, audio_cbr: number): number;
    answerEx(wuser: number, convid: string, sft_url: string, sft_token: string, call_type: number, audio_cbr: number, extcodec_arg: number): number;
    confAnswer(wuser: number, convid: string, sft_url: string, sft_token: string, call_type: number, audio_cbr: number): number;
    resp(wuser: number, status: number, reason: string, ctx: number): void;
    configUpdate(wuser: number, err: number, json_str: string): void;
    sftResp(wuser: number, perr: number, buf: string, len: number, ctx: number): void;
    recvMsg(wuser: number, buf: string, len: number, curr_time: number, msg_time: number, convid: string, userid: string, clientid: string): number;
    end(wuser: number, convid: string): void;
    reject(wuser: number, convid: string): number;
    isVideoCall(wuser: number, convid: string): number;
    setMediaEstabHandler(wuser: number, mestabh: WcallMediaEstabHandler): void;
    setMediaStoppedHandler(wuser: number, mstoph: WcallMediaStoppedHandler): void;
    setDataChanEstabHandler(wuser: number, dcestabh: WcallDataChanEstabHandler): void;
    setExtcodecArg(wuser: number, peer: number, convid: string, userid: string, arg?: number): void;
    setVideoSendState(wuser: number, convid: string, state: number): void;
    setVideoHandlers(render_frame_h: any, size_h: WcallVideoSizeHandler, arg?: number): void;
    networkChanged(wuser: number): void;
    setGroupChangedHandler(wuser: number, chgh: WcallGroupChangedHandler, arg?: number): void;
    setParticipantChangedHandler(wuser: number, chgh: WcallParticipantChangedHandler, arg?: number): void;
    setNetworkQualityHandler(wuser: number, netqh: WcallNetworkQualityHandler, interval: number, arg?: number): number;
    setLogHandler(logh: WcallLogHandler, arg?: number): void;
    getMute(wuser: number): number;
    setMute(wuser: number, muted: number): void;
    setMuteHandler(wuser: number, muteh: WcallMuteHandler, arg?: number): void;
    setStateHandler(wuser: number, stateh: WcallStateChangeHandler): void;
    getState(wuser: number, convid: string): number;
    iterateState(wuser: number, stateh: WcallStateChangeHandler, arg?: number): void;
    propsyncRequest(wuser: number, convid: string): void;
    freeMembersJson(members: string): void;
    enablePrivacy(wuser: number, enabled: number): void;
    setReqClientsHandler(wuser: number, reqch: WcallReqClientsHandler): void;
    setClientsForConv(wuser: number, convid: string, carray: string, clen: number): number;
    poll(): void;
    setUserMediaHandler(userMediaHandler: UserMediaHandler): void;
    setMediaStreamHandler(mediaStreamHandler: MediaStreamHandler): void;
    replaceTrack(convid: string, newTrack: MediaStreamTrack): void;
    getStats(convid: string): Promise<Array<{
        userid: string;
        stats: RTCStatsReport;
    }>>;
}
export declare const getAvsInstance: () => Promise<Wcall>;
