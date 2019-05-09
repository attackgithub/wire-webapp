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

import {CallLogger} from '../../telemetry/calling/CallLogger';
import {CALL_MESSAGE_TYPE} from '../enum/CallMessageType';
import {PROPERTY_STATE} from '../enum/PropertyState';
import {SDP_NEGOTIATION_MODE} from '../enum/SDPNegotiationMode';
import {FlowEntity} from './FlowEntity';
import {WebAppEvents} from '../../event/WebApp';
import {AudioType} from '../../audio/AudioType';
import {CallError} from '../../error/CallError';

class ParticipantEntity {
  static get CONFIG() {
    return {
      PROPERTY_STATES: {
        ACTIVE: [PROPERTY_STATE.PAUSED, PROPERTY_STATE.TRUE],
        EXPECTED: [PROPERTY_STATE.FALSE, PROPERTY_STATE.PAUSED, PROPERTY_STATE.TRUE],
      },
    };
  }
  /**
   * Construct a new participant.
   *
   * @param {CallEntity} callEntity - Call entity
   * @param {User} user - User entity to base the participant on
   * @param {CallSetupTimings} timings - Timing statistics of call setup steps
   */
  constructor(callEntity, user, timings) {
    this.callEntity = callEntity;
    this.user = user;

    this.id = this.user.id;
    this.messageLog = this.callEntity.messageLog;
    this.sessionId = undefined;

    this.callLogger = new CallLogger('ParticipantEntity', this.id, this.messageLog);

    this.callLogger.info(`Created new participant entity for user ${this.id}`);

    this.isConnected = ko.observable(false);
    this.panning = ko.observable(0.0);
    this.wasConnected = false;

    this.state = {
      audioSend: ko.observable(PROPERTY_STATE.TRUE),
      screenSend: ko.observable(PROPERTY_STATE.FALSE),
      videoSend: ko.observable(PROPERTY_STATE.FALSE),
    };

    this.activeState = {
      audioSend: ko.pureComputed(() => {
        return ParticipantEntity.CONFIG.PROPERTY_STATES.ACTIVE.includes(this.state.audioSend());
      }),
      screenSend: ko.pureComputed(() => {
        return ParticipantEntity.CONFIG.PROPERTY_STATES.ACTIVE.includes(this.state.screenSend());
      }),
      videoSend: ko.pureComputed(() => {
        return ParticipantEntity.CONFIG.PROPERTY_STATES.ACTIVE.includes(this.state.videoSend());
      }),
    };

    this.hasActiveVideo = ko.pureComputed(() => this.activeState.screenSend() || this.activeState.videoSend());

    this.flowEntity = new FlowEntity(this.callEntity, this, timings);

    this.isConnected.subscribe(isConnected => {
      if (isConnected && !this.wasConnected) {
        amplify.publish(WebAppEvents.AUDIO.PLAY, AudioType.READY_TO_TALK);
        this.wasConnected = true;
      }
    });
  }

  /**
   * Reset the participant.
   * @returns {undefined} No return value
   */
  resetParticipant() {
    if (this.flowEntity) {
      this.flowEntity.resetFlow();
    }
  }

  /**
   * Start negotiating the peer connection.
   * @returns {undefined} No return value
   */
  startNegotiation() {
    this.flowEntity.startNegotiation();
  }

  /**
   * Update the participant state.
   * @param {CallMessageEntity} callMessageEntity - Call message to update state from.
   * @returns {Promise} Resolves when the state was updated
   */
  updateState(callMessageEntity) {
    const {clientId, properties, sdp: rtcSdp, sessionId, type} = callMessageEntity;

    return this.updateProperties(properties).then(() => {
      this.sessionId = sessionId;
      this.flowEntity.setRemoteClientId(clientId);

      const isGroupStart = type === CALL_MESSAGE_TYPE.GROUP_START;
      if (isGroupStart && this.flowEntity.pcInitialized()) {
        this.flowEntity.restartNegotiation(SDP_NEGOTIATION_MODE.STATE_COLLISION, false);
      }

      return rtcSdp ? this.flowEntity.saveRemoteSdp(callMessageEntity) : false;
    });
  }

  /**
   * Update the state properties
   * @param {Object} properties - Properties to update with
   * @returns {Promise} Resolves when the properties have been updated
   */
  updateProperties(properties) {
    return Promise.resolve().then(() => {
      if (properties) {
        const {audiosend, screensend, videosend} = properties;

        const hasAudioSend = ParticipantEntity.CONFIG.PROPERTY_STATES.EXPECTED.includes(audiosend);
        if (hasAudioSend) {
          this.state.audioSend(audiosend);
        }

        const hasScreenSend = ParticipantEntity.CONFIG.PROPERTY_STATES.EXPECTED.includes(screensend);
        if (hasScreenSend) {
          this.state.screenSend(screensend);
        }

        const hasVideoSend = ParticipantEntity.CONFIG.PROPERTY_STATES.EXPECTED.includes(videosend);
        if (hasVideoSend) {
          this.state.videoSend(videosend);
        }
      }
    });
  }

  /**
   * Verify client IDs match.
   * @param {string} clientId - Client ID to match with participant one
   * @returns {undefined} No return value
   */
  verifyClientId(clientId) {
    if (clientId) {
      const connectedClientId = this.flowEntity.remoteClientId;

      const isExpectedId = clientId === connectedClientId;
      const requestedByWrongSender = connectedClientId && !isExpectedId;
      if (requestedByWrongSender) {
        const logMessage = {
          data: {
            default: [clientId, connectedClientId],
            obfuscated: [this.callLogger.obfuscate(clientId), this.callLogger.obfuscate(connectedClientId)],
          },
          message: `State change requested from '{0}' while we are connected to '{1}'`,
        };
        this.callLogger.warn(logMessage, this);
        throw new CallError(CallError.TYPE.WRONG_SENDER);
      }

      this.flowEntity.remoteClientId = clientId;
    } else {
      throw new CallError(CallError.TYPE.WRONG_SENDER, 'Sender ID missing');
    }
  }
}

export {ParticipantEntity};
