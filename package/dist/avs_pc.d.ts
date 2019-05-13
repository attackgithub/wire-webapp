import { WcallLogHandler } from "./avs_wcall";
export declare type UserMediaHandler = (convid: string, useAudio: boolean, useVideo: boolean, useScreenShare: boolean) => Promise<MediaStream>;
export declare type VideoTrackHandler = (convid: string, remote_userid: string, remote_clientid: string, mediaTracks: MediaStreamTrack[]) => void;
declare function pc_InitModule(module: any, logh: WcallLogHandler): void;
declare function pc_SetUserMediaHandler(umh: UserMediaHandler): void;
declare function pc_SetVideoTrackHandler(vth: VideoTrackHandler): void;
declare function pc_ReplaceTrack(convid: string, newTrack: MediaStreamTrack): void;
declare const _default: {
    init: typeof pc_InitModule;
    setUserMediaHandler: typeof pc_SetUserMediaHandler;
    setVideoTrackHandler: typeof pc_SetVideoTrackHandler;
    replaceTrack: typeof pc_ReplaceTrack;
};
export default _default;
