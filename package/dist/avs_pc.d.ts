import { WcallLogHandler } from "./avs_wcall";
export declare type UserMediaHandler = (convid: string, useAudio: boolean, useVideo: boolean, useScreenShare: boolean) => Promise<MediaStream>;
export declare type MediaStreamHandler = (convid: string, remote_userid: string, remote_clientid: string, streams: readonly MediaStream[]) => void;
declare function pc_InitModule(module: any, logh: WcallLogHandler): void;
declare function pc_SetUserMediaHandler(umh: UserMediaHandler): void;
declare function pc_SetMediaStreamHandler(msh: MediaStreamHandler): void;
declare function pc_ReplaceTrack(convid: string, newTrack: MediaStreamTrack): void;
declare function pc_GetStats(convid: string): Promise<Array<{
    userid: string;
    stats: RTCStatsReport;
}>>;
declare const _default: {
    init: typeof pc_InitModule;
    setUserMediaHandler: typeof pc_SetUserMediaHandler;
    setMediaStreamHandler: typeof pc_SetMediaStreamHandler;
    replaceTrack: typeof pc_ReplaceTrack;
    getStats: typeof pc_GetStats;
};
export default _default;
