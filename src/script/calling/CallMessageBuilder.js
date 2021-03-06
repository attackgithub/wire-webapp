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

import {serverTimeHandler} from '../time/serverTimeHandler';
import {CALL_MESSAGE_TYPE} from './enum/CallMessageType';
import {CallMessageEntity} from './entities/CallMessageEntity';

const buildCallMessage = (type, response, sessionId, additionalPayload) => {
  const callMessageEntity = new CallMessageEntity(type, response, sessionId);

  if (additionalPayload) {
    callMessageEntity.addProperties(additionalPayload);
  }

  return callMessageEntity;
};

const buildCancel = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.CANCEL, response, sessionId, additionalPayload);
};

const buildGroupCheck = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.GROUP_CHECK, response, sessionId, additionalPayload);
};

const buildGroupLeave = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.GROUP_LEAVE, response, sessionId, additionalPayload);
};

const buildGroupSetup = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.GROUP_SETUP, response, sessionId, additionalPayload);
};

const buildGroupStart = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.GROUP_START, response, sessionId, additionalPayload);
};

const buildHangup = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.HANGUP, response, sessionId, additionalPayload);
};

const buildPropSync = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.PROP_SYNC, response, sessionId, additionalPayload);
};

const buildReject = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.REJECT, response, sessionId, additionalPayload);
};

const buildSetup = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.SETUP, response, sessionId, additionalPayload);
};

const buildUpdate = (response, sessionId, additionalPayload) => {
  return buildCallMessage(CALL_MESSAGE_TYPE.UPDATE, response, sessionId, additionalPayload);
};

/**
 * Create additional payload.
 *
 * @param {string} conversationId - ID of conversation
 * @param {string} selfUserId - ID of self user
 * @param {string} [remoteUserId] - Optional ID of remote user
 * @param {string} [remoteClientId] - Optional ID of remote client
 * @returns {{conversationId: string, remoteClientId: string, remoteUserId: *, time: string, userId: string}} Additional payload
 */
const createPayload = (conversationId, selfUserId, remoteUserId, remoteClientId) => {
  const time = serverTimeHandler.toServerTimestamp(Date.now());
  return {conversationId, remoteClientId, remoteUserId, time: new Date(time).toISOString(), userId: selfUserId};
};

/**
 * Create properties payload for call events.
 *
 * @param {Object} selfState - Current self state
 * @param {Object} additionalPayload - Optional additional payload to be added
 * @param {boolean} [videoStateOverwrite] - Forces the videosend property to be this value instead of the one in the selfState
 * @returns {Object} call message props object
 */
const createPropSync = (selfState, additionalPayload, videoStateOverwrite) => {
  const payload = {};
  const {audioSend: audioState, videoSend: videoState, screenSend: screenState} = selfState;
  const videoSend = _.isBoolean(videoStateOverwrite) ? videoStateOverwrite : videoState();

  payload.properties = {
    audiosend: `${audioState()}`,
    screensend: `${screenState()}`,
    videosend: `${videoSend}`,
  };

  return additionalPayload ? Object.assign(payload, additionalPayload) : payload;
};

export const CallMessageBuilder = {
  buildCancel,
  buildGroupCheck,
  buildGroupLeave,
  buildGroupSetup,
  buildGroupStart,
  buildHangup,
  buildPropSync,
  buildReject,
  buildSetup,
  buildUpdate,
  createPayload,
  createPropSync,
};
