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

import ko from 'knockout';
import moment from 'moment';

import {copyText} from 'Util/ClipboardUtil';
import {t} from 'Util/LocalizerUtil';

import {Confirmation} from '@wireapp/protocol-messaging';
import {QuoteEntity} from '../../message/QuoteEntity';
import {SuperType} from '../../message/SuperType';
import {User} from '../User';
import {Asset} from './Asset';
import {MessageEntity} from './Message';

export class ContentMessageEntity extends MessageEntity {
  assets: ko.ObservableArray<Asset>;
  edited_timestamp: ko.Observable<string>;
  is_liked_provisional: ko.Observable<boolean>;
  is_liked: ko.PureComputed<boolean>;
  like_caption: ko.PureComputed<string>;
  other_likes: ko.PureComputed<User[]>;
  quote: ko.Observable<QuoteEntity>;
  reactions_user_ets: ko.ObservableArray<User>;
  reactions_user_ids: ko.PureComputed<string>;
  reactions: ko.Observable<Record<string, any>>;
  readReceipts: ko.ObservableArray<Confirmation>;
  replacing_message_id: string | null;
  super_type: SuperType;
  version: number;
  was_edited: ko.PureComputed<boolean>;

  constructor(id: string) {
    super(id);

    this.assets = ko.observableArray([]);
    this.super_type = SuperType.CONTENT;
    this.replacing_message_id = null;
    this.edited_timestamp = ko.observable(null);

    this.was_edited = ko.pureComputed(() => !!this.edited_timestamp());

    this.reactions = ko.observable({});
    this.reactions_user_ets = ko.observableArray();
    this.reactions_user_ids = ko.pureComputed(() => {
      return this.reactions_user_ets()
        .map(user_et => user_et.first_name())
        .join(', ');
    });

    this.quote = ko.observable();
    this.readReceipts = ko.observableArray([]);

    this.is_liked_provisional = ko.observable();
    this.is_liked = ko.pureComputed({
      read: () => {
        if (this.is_liked_provisional() != null) {
          const is_liked_provisional = this.is_liked_provisional();
          this.is_liked_provisional(null);
          return is_liked_provisional;
        }
        const likes = this.reactions_user_ets().filter(user_et => user_et.is_me);
        return likes.length === 1;
      },
      write: value => {
        return this.is_liked_provisional(value);
      },
    });
    this.other_likes = ko.pureComputed(() => this.reactions_user_ets().filter(user_et => !user_et.is_me));

    this.like_caption = ko.pureComputed(() => {
      if (this.reactions_user_ets().length <= 5) {
        return this.reactions_user_ets()
          .map(user_et => user_et.first_name())
          .join(', ');
      }
      return t('conversationLikesCaption', this.reactions_user_ets().length);
    });
  }

  display_edited_timestamp(): string {
    return t('conversationEditTimestamp', moment(this.edited_timestamp()).format('LT'));
  }

  add_asset(asset_et: Asset): void {
    this.assets.push(asset_et);
  }

  copy(): void {
    copyText(this.get_first_asset().text);
  }

  /**
   * Get the first asset attached to the message.
   */
  get_first_asset(): Asset {
    return this.assets()[0];
  }

  getUpdatedReactions({
    data: event_data,
    from,
  }: {
    data: any;
    from: string;
  }): {reactions: Record<string, any>; version: number} | false {
    const reaction = event_data && event_data.reaction;
    const hasUser = this.reactions()[from];
    const shouldAdd = reaction && !hasUser;
    const shouldDelete = !reaction && hasUser;

    if (!shouldAdd && !shouldDelete) {
      return false;
    }

    const newReactions = {...this.reactions()};

    if (shouldAdd) {
      newReactions[from] = reaction;
    } else {
      delete newReactions[from];
    }

    return {reactions: newReactions, version: this.version + 1};
  }

  /**
   * @returns `true` if the message mentions the user.
   */
  isUserMentioned(userId: string): boolean {
    return this.has_asset_text()
      ? this.assets().some(assetEntity => assetEntity.is_text() && assetEntity.isUserMentioned(userId))
      : false;
  }

  /**
   * @returns `true` if the message quotes the user.
   */
  isUserQuoted(userId: string): boolean {
    return this.quote() ? this.quote().isQuoteFromUser(userId) : false;
  }

  /**
   * @returns `true` if the user was mentioned or quoted.
   */
  isUserTargeted(userId: string): boolean {
    return this.isUserMentioned(userId) || this.isUserQuoted(userId);
  }

  /**
   * Download message content.
   */
  download(): void {
    const asset_et = this.get_first_asset();
    const file_name = this.get_content_name();
    asset_et.download(file_name);
  }

  get_content_name(): string {
    const asset_et = this.get_first_asset();
    let {file_name} = asset_et;

    if (!file_name) {
      const date = moment(this.timestamp());
      file_name = `Wire ${date.format('YYYY-MM-DD')} at ${date.format('LT')}`;
    }

    if (asset_et.file_type) {
      const file_extension = asset_et.file_type.split('/').pop();
      file_name = `${file_name}.${file_extension}`;
    }

    return file_name;
  }
}
