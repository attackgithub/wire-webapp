/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

import {ClientClassification} from '@wireapp/api-client/dist/commonjs/client/';
import {ClientEntity} from '../client/ClientEntity';
import {User} from './User';

describe('User', () => {
  describe('isOnLegalHold', () => {
    it('is true as soon as the user has a legal hold classified client', () => {
      const user = new User('c2f12aa0-c5cd-4826-a4d9-1609c6c032df');
      const desktopClient = new ClientEntity(true, ClientClassification.DESKTOP);
      user.add_client(desktopClient);
      expect(user.isOnLegalHold()).toBe(false);

      const legalHoldClient = new ClientEntity(true, ClientClassification.LEGAL_HOLD);
      user.add_client(legalHoldClient);
      expect(user.isOnLegalHold()).toBe(true);
    });
  });
});
