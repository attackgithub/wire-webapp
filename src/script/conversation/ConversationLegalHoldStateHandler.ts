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

import {amplify} from 'amplify';
import {intersection} from 'underscore';

import {Logger, getLogger} from 'Util/Logger';

import {ClientRepository} from '../client/ClientRepository';
import {Conversation} from '../entity/Conversation';
import {EventRepository} from '../event/EventRepository';
import {WebAppEvents} from '../event/WebApp';
import {ConversationRepository} from './ConversationRepository';

export class ConversationLegalHoldStateHandler {
  conversationRepository: ConversationRepository;
  eventRepository: EventRepository;
  logger: Logger;
  clientRepository: ClientRepository;

  constructor(
    conversationRepository: ConversationRepository,
    eventRepository: EventRepository,
    clientRepository: ClientRepository
  ) {
    this.conversationRepository = conversationRepository;
    this.eventRepository = eventRepository;
    this.clientRepository = clientRepository;
    this.logger = getLogger('ConversationLegalHoldStateHandler');

    amplify.subscribe(WebAppEvents.USER.CLIENT_ADDED, this.onClientsAdded);
    amplify.subscribe(WebAppEvents.USER.CLIENT_REMOVED, this.onClientRemoved);
    amplify.subscribe(WebAppEvents.USER.CLIENTS_UPDATED, this.onClientsUpdated);
  }

  onClientsAdded = (userIds: string | string[]) => {
    userIds = [].concat(userIds);
  };
  onClientRemoved = () => {
    this.getActiveConversationsWithUsers([]);
    this.checkLegalHoldState(this.conversationRepository.active_conversation(), []);
  };
  onClientsUpdated = () => {};

  // TODO: move this method to the conversation repo and use it in ConversationVerificationStateHandler

  private getActiveConversationsWithUsers(userIds: string[]) {
    const selfUserId = this.conversationRepository.selfUser().id;
    return this.conversationRepository
      .filtered_conversations()
      .reduce(
        (
          conversationList: {conversationEntity: Conversation; userIds: string[]}[],
          conversationEntity: Conversation
        ) => {
          if (!conversationEntity.removed_from_conversation()) {
            const userIdsInConversation = conversationEntity.participating_user_ids().concat(selfUserId);
            const matchingUserIds = intersection(userIdsInConversation, userIds);

            if (!!matchingUserIds.length) {
              conversationList.push({conversationEntity, userIds: matchingUserIds});
            }
          }
          return conversationList;
        },
        []
      );
  }

  private checkLegalHoldState(conversation: Conversation, userIds: string[]) {
    const users = conversation.participating_user_ets().filter(userEntity => userIds.includes(userEntity.id));
    return users;
  }
}
