/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import {getLogger} from 'Util/Logger';
import {TIME_IN_MILLIS, formatSeconds} from 'Util/TimeUtil';
import {Environment} from 'Util/Environment';

import * as trackingHelpers from '../../tracking/Helpers';
import {EventName} from '../../tracking/EventName';
import {MediaType} from '../../media/MediaType';
//import {MediaDeviceType} from '../../media/MediaDeviceType';
import {WebAppEvents} from '../../event/WebApp';

export class FullscreenVideoCalling {
  static get CONFIG() {
    return {
      AUTO_MINIMIZE_TIMEOUT: TIME_IN_MILLIS.SECOND * 4,
      HIDE_CONTROLS_TIMEOUT: TIME_IN_MILLIS.SECOND * 4,
    };
  }

  constructor({videoGrid, call, conversation, multitasking, canShareScreen, callActions, isMuted}) {
    this.call = call;
    this.conversation = conversation;
    this.videoGrid = videoGrid;
    this.multitasking = multitasking;
    this.isMuted = isMuted;
    this.callActions = callActions;
    this.logger = getLogger('VideoCallingViewModel');

    this.HIDE_CONTROLS_TIMEOUT = FullscreenVideoCalling.CONFIG.HIDE_CONTROLS_TIMEOUT;

    this.showRemoteParticipant = ko.pureComputed(() => false); // TODO
    this.canShareScreen = canShareScreen;
    this.selfSharesScreen = ko.pureComputed(() => call.selfParticipant.sharesScreen()); // TODO
    this.showSwitchCamera = ko.pureComputed(() => {
      return false; //TODO handle multiple cameras
      /*
      const hasMultipleCameras = this.availableDevices.videoInput().length > 1;
      const isVisible = hasMultipleCameras && this.localVideoStream() && this.selfStreamState.videoSend();
      return this.isCallOngoing() && isVisible;
      */
    });
    this.showSwitchScreen = ko.pureComputed(() => {
      return false; // TODO handle multi input devices
      /*
      const hasMultipleScreens = this.availableDevices.screenInput().length > 1;
      const isVisible = hasMultipleScreens && this.localVideoStream() && this.selfStreamState.screenSend();
      return this.isCallOngoing() && isVisible;
      */
    });

    this.isChoosingScreen = ko.observable(false); // TODO
    this.showToggleVideo = ko.pureComputed(() => {
      return conversation().supportsVideoCall(false);
    });

    this.callDuration = ko.observable();
    let callDurationUpdateInterval;
    const startedAtSubscription = ko.computed(() => {
      const startedAt = call.startedAt;
      if (startedAt) {
        const updateTimer = () => {
          const time = Math.floor((Date.now() - startedAt) / 1000);
          this.callDuration(formatSeconds(time));
        };
        updateTimer();
        callDurationUpdateInterval = window.setInterval(updateTimer, 1000);
      }
    });

    this.hasUnreadMessages = ko.observable(false);
    amplify.subscribe(WebAppEvents.LIFECYCLE.UNREAD_COUNT, unreadCount => this.hasUnreadMessages(unreadCount > 0));

    this.dispose = () => {
      window.clearInterval(callDurationUpdateInterval);
      startedAtSubscription.dispose();
    };

    /*
    this.clickedOnCancelScreen = this.clickedOnCancelScreen.bind(this);
    this.clickedOnChooseScreen = this.clickedOnChooseScreen.bind(this);
    this.chooseSharedScreen = this.chooseSharedScreen.bind(this);

    this.callingRepository = repositories.calling;
    this.conversationRepository = repositories.conversation;
    this.mediaRepository = repositories.media;
    this.userRepository = repositories.user;

    this.contentViewModel = mainViewModel.content;
    this.multitasking = this.contentViewModel.multitasking;

    this.hasSelfVideo = this.streamHandler.hasActiveVideo;
    this.selfStreamState = this.streamHandler.selfStreamState;
    this.localVideoStream = this.streamHandler.localMediaStream;
    this.remoteVideoStreamsInfo = this.streamHandler.remoteMediaStreamInfoIndex.video;

    this.minimizeTimeout = undefined;

    this.calls = this.callingRepository.calls;
    this.joinedCall = this.callingRepository.joinedCall;

    this.remoteUser = ko.pureComputed(() => {
      const [participantEntity] = this.joinedCall() ? this.joinedCall().participants() : [];

      if (participantEntity) {
        return participantEntity.user;
      }
    });

    this.showRemoteParticipant = ko.pureComputed(() => {
      const showRemoteParticipant = this.remoteUser() && !this.multitasking.isMinimized() && !this.isChoosingScreen();
      return showRemoteParticipant && this.isCallOngoing() && !this.showRemoteVideo();
    });

    this.showRemoteVideo = ko.pureComputed(() => {
      if (this.isCallOngoing()) {
        const remoteVideoState = this.joinedCall() && this.joinedCall().isRemoteVideoCall();
        return remoteVideoState && this.remoteVideoStreamsInfo().length;
      }
    });

    this.showSwitchCamera = ko.pureComputed(() => {
      const hasMultipleCameras = this.availableDevices.videoInput().length > 1;
      const isVisible = hasMultipleCameras && this.localVideoStream() && this.selfStreamState.videoSend();
      return this.isCallOngoing() && isVisible;
    });
    this.showSwitchScreen = ko.pureComputed(() => {
      const hasMultipleScreens = this.availableDevices.screenInput().length > 1;
      const isVisible = hasMultipleScreens && this.localVideoStream() && this.selfStreamState.screenSend();
      return this.isCallOngoing() && isVisible;
    });

    this.showToggleVideo = ko.pureComputed(() => {
      return this.joinedCall() ? this.joinedCall().conversationEntity.supportsVideoCall(false) : false;
    });
    this.disableToggleScreen = ko.pureComputed(() => !this.callingRepository.supportsScreenSharing);

    this.visibleCallId = undefined;
    this.joinedCall.subscribe(callEntity => {
      if (callEntity) {
        const isVisibleId = this.visibleCallId === callEntity.id;
        if (!isVisibleId) {
          this.visibleCallId = callEntity.id;

          // FIXME find a better condition to actually minimize/maximize the call
          // we should do this when we check that everything is alright with audio calls also
          if (this.showRemoteVideo()) {
            this.multitasking.isMinimized(false);
            return this.logger.info(`Maximizing video call '${callEntity.id}' to full-screen`, callEntity);
          }

          //this.multitasking.isMinimized(true);
          this.logger.info(`Minimizing audio call '${callEntity.id}' from full-screen`, callEntity);
        }
      } else {
        this.visibleCallId = undefined;
        this.multitasking.autoMinimize(true);
        this.multitasking.isMinimized(false);
        this.logger.info('Resetting full-screen calling to maximize');
      }
    });

    this.showRemoteParticipant.subscribe(showRemoteParticipant => {
      if (this.minimizeTimeout) {
        window.clearTimeout(this.minimizeTimeout);
        this.minimizeTimeout = undefined;
      }

      const isVideoCall = showRemoteParticipant && this.videodCall();
      const shouldAutoMinimize = isVideoCall && this.multitasking.autoMinimize() && !this.isChoosingScreen();
      if (shouldAutoMinimize) {
        const remoteUserName = this.remoteUser() ? this.remoteUser().name() : '';

        const callId = this.videodCall().id;
        const logMessage = `Scheduled minimizing call '${callId}' as remote user '${remoteUserName}' is not videod`;
        this.logger.info(logMessage);
        this.minimizeTimeout = window.setTimeout(() => {
          if (!this.isChoosingScreen()) {
            this.multitasking.isMinimized(true);
          }
          const message = `Minimizing call '${callId}' on timeout as remote user '${remoteUserName}' is not videod`;
          this.logger.info(message);
        }, VideoCallingViewModel.CONFIG.AUTO_MINIMIZE_TIMEOUT);
      }
    });


    amplify.subscribe(WebAppEvents.CALL.MEDIA.CHOOSE_SCREEN, this.chooseSharedScreen);

    this.MediaDeviceType = MediaDeviceType;
    */
  }

  chooseSharedScreen(conversationId) {
    const skipScreenSelection =
      this.selfStreamState.screenSend() || Environment.browser.firefox || navigator.mediaDevices.getDisplayMedia;
    if (skipScreenSelection) {
      amplify.publish(WebAppEvents.CALL.MEDIA.TOGGLE, conversationId, MediaType.SCREEN);
      return;
    }

    if (window.desktopCapturer) {
      this.mediaRepository.devicesHandler
        .getScreenSources()
        .then(screenSources => {
          const conversationEntity = this.joinedCall().conversationEntity;

          const attributes = {
            conversation_type: trackingHelpers.getConversationType(conversationEntity),
            kind_of_call_when_sharing: this.joinedCall().isRemoteVideoSend() ? 'video' : 'audio',
            num_screens: screenSources.length,
          };

          const isTeamConversation = !!conversationEntity.team_id;
          if (isTeamConversation) {
            Object.assign(attributes, trackingHelpers.getGuestAttributes(conversationEntity));
          }

          amplify.publish(WebAppEvents.ANALYTICS.EVENT, EventName.CALLING.SHARED_SCREEN, attributes);

          const hasMultipleScreens = screenSources.length > 1;
          if (hasMultipleScreens) {
            this.isChoosingScreen(true);
            if (this.multitasking.isMinimized()) {
              this.multitasking.resetMinimize(true);
              this.multitasking.isMinimized(false);
            }
          } else {
            amplify.publish(WebAppEvents.CALL.MEDIA.TOGGLE, conversationId, MediaType.SCREEN);
          }
        })
        .catch(error => {
          this.logger.error('Unable to get screens sources for sharing', error);
        });
    }
  }

  clickedOnCancelScreen() {
    this.isChoosingScreen(false);
  }

  clickedOnShareScreen() {
    this.chooseSharedScreen(this.joinedCall().id);
  }

  clickedOnChooseScreen(screenSource) {
    this.currentDeviceId.screenInput('');

    this.logger.info(`Selected '${screenSource.name}' for screen sharing`, screenSource);
    this.isChoosingScreen(false);
    this.currentDeviceId.screenInput(screenSource.id);
    amplify.publish(WebAppEvents.CALL.MEDIA.TOGGLE, this.joinedCall().id, MediaType.SCREEN);

    if (this.multitasking.resetMinimize()) {
      this.multitasking.isMinimized(true);
      this.multitasking.resetMinimize(false);
      this.logger.info(`Minimizing call '${this.joinedCall().id}' on screen selection to return to previous state`);
    }
  }

  clickedOnStopVideo() {
    throw new Error('not implemented (toggeling video)');
  }

  clickedOnToggleCamera() {
    this.mediaRepository.devicesHandler.toggleNextCamera();
  }

  clickedOnToggleScreen() {
    this.mediaRepository.devicesHandler.toggleNextScreen();
  }

  minimize() {
    this.multitasking.isMinimized(true);
  }
}

ko.components.register('fullscreen-video-call', {
  template: `
<div id="video-calling" data-bind="hide_controls: {timeout: HIDE_CONTROLS_TIMEOUT, skipClass: 'video-controls__button'}" class="video-calling">
  <div id="video-element-remote" class="video-element-remote">
    <group-video-grid params="grid: videoGrid, muted: isMuted"></group-video-grid>
  </div>

  <!-- ko if: showRemoteParticipant() -->
    <div class="video-element-remote-participant">
      <!-- ko ifnot: videodCall().isGroup -->
        <participant-avatar class="video-element-remote-participant avatar-no-badge" params="participant: remoteUser, size: z.components.ParticipantAvatar.SIZE.X_LARGE"></participant-avatar>
      <!-- /ko -->
    </div>
  <!-- /ko -->

  <!-- ko if: !isChoosingScreen() -->
    <div class="video-element-overlay hide-controls-hidden"></div>
  <!-- /ko -->

  <div id="video-title" class="video-title hide-controls-hidden">
    <div class="video-remote-name" data-bind="text: conversation().display_name()"></div>
    <div class="video-timer label-xs" data-bind="text: callDuration()"></div>
  </div>


  <!-- ko ifnot: isChoosingScreen() -->
    <div id="video-controls" class="video-controls hide-controls-hidden">
      <div class="video-controls__fit-info" data-bind="text: t('videoCallOverlayFitVideoLabel')" data-uie-name="label-fit-fill-info"></div>
      <div class="video-controls__wrapper">

        <div class="video-controls__button" data-bind="click: minimize" data-uie-name="do-call-controls-video-minimize">
          <!-- ko if: hasUnreadMessages() -->
            <message-unread-icon></message-unread-icon>
          <!-- /ko -->
          <!-- ko ifnot: hasUnreadMessages() -->
            <message-icon></message-icon>
          <!-- /ko -->
          <div class="video-controls__button__label" data-bind="text: t('videoCallOverlayConversations')"></div>
        </div>

        <div class="video-controls__button"
            data-bind="click: () => callActions.toggleMute(call, !isMuted()), css: {'video-controls__button--active': isMuted()}, attr: {'data-uie-value': !isMuted() ? 'inactive' : 'active'}"
            data-uie-name="do-call-controls-video-call-mute">
          <micoff-icon></micoff-icon>
          <div class="video-controls__button__label" data-bind="text: t('videoCallOverlayMute')"></div>
        </div>

        <!-- ko if: showToggleVideo() -->
          <div class="video-controls__button"
              data-bind="click: clickedOnStopVideo, css: {'video-controls__button--active': call.selfParticipant.sharesCamera()}, attr: {'data-uie-value': call.selfParticipant.sharesCamera() ? 'active' : 'inactive'}"
              data-uie-name="do-call-controls-toggle-video">
            <camera-icon></camera-icon>
            <!-- ko if: showSwitchCamera() -->
              <device-toggle-button data-bind="click: clickedOnToggleCamera, clickBubble: false"
                                    params="index: currentDeviceIndex.videoInput, devices: availableDevices.videoInput, type: MediaDeviceType.VIDEO_INPUT">
              </device-toggle-button>
            <!-- /ko -->
            <!-- ko ifnot: showSwitchCamera() -->
              <div class="video-controls__button__label" data-bind="text: t('videoCallOverlayVideo')"></div>
            <!-- /ko -->
          </div>
        <!-- /ko -->

        <div class="video-controls__button"
            data-bind="
              tooltip: {text: t('videoCallScreenShareNotSupported'), disabled: canShareScreen},
              click: () => callActions.toggleScreenshare(call),
              css: {'video-controls__button--active': selfSharesScreen(), 'video-controls__button--disabled': !canShareScreen},
              attr: {'data-uie-value': selfSharesScreen() ? 'active' : 'inactive', 'data-uie-enabled': canShareScreen ? 'true' : 'false'}"
            data-uie-name="do-toggle-screen">
          <screenshare-icon></screenshare-icon>
          <!-- ko if: showSwitchScreen() -->
            <device-toggle-button
              data-bind="click: clickedOnToggleScreen, clickBubble: false"
              params="index: currentDeviceIndex.screenInput, devices: availableDevices.screenInput, type: MediaDeviceType.SCREEN_INPUT"
          >
            </device-toggle-button>
          <!-- /ko -->
          <!-- ko ifnot: showSwitchScreen() -->
            <div class="video-controls__button__label" data-bind="text: t('videoCallOverlayShareScreen')"></div>
          <!-- /ko -->
        </div>

        <div class="video-controls__button video-controls__button--red" data-bind="click: () => callActions.leave(call)" data-uie-name="do-call-controls-video-call-cancel">
          <hangup-icon></hangup-icon>
          <div class="video-controls__button__label" data-bind="text: t('videoCallOverlayHangUp')"></div>
        </div>
     </div>
   </div>
 <!-- /ko -->

</div>
  `,
  viewModel: FullscreenVideoCalling,
});
