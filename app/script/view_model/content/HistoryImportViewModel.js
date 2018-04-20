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

'use strict';

window.z = window.z || {};
window.z.viewModel = z.viewModel || {};
window.z.viewModel.content = z.viewModel.content || {};

z.viewModel.content.HistoryImportViewModel = class HistoryImportViewModel {
  static get STATE() {
    return {
      DONE: 'HistoryImportViewModel.STATE.DONE',
      IMPORTING: 'HistoryImportViewModel.STATE.IMPORTING',
      PREPARING: 'HistoryImportViewModel.STATE.PREPARING',
    };
  }

  constructor(mainViewModel, contentViewModel, repositories) {
    this.error = ko.observable(null);
    this.errorHeadline = ko.observable('');
    this.errorSecondary = ko.observable('');

    this.state = ko.observable(HistoryImportViewModel.STATE.PREPARING);
    this.isPreparing = ko.pureComputed(() => !this.error() && this.state() === HistoryImportViewModel.STATE.PREPARING);
    this.isImporting = ko.pureComputed(() => !this.error() && this.state() === HistoryImportViewModel.STATE.IMPORTING);
    this.isDone = ko.pureComputed(() => !this.error() && this.state() === HistoryImportViewModel.STATE.DONE);

    this.numberOfTables = ko.observable(0);
    this.numberOfProcessedTables = ko.observable(0);
    this.loadingProgress = ko.pureComputed(() => this.numberOfProcessedTables() / this.numberOfTables() * 100);

    this.loadingMessage = ko.pureComputed(() => {
      switch (this.state()) {
        case HistoryImportViewModel.STATE.PREPARING: {
          return z.l10n.text(z.string.backupImportProgressHeadline);
        }
        case HistoryImportViewModel.STATE.IMPORTING: {
          const replacements = {
            processed: this.numberOfProcessedTables(),
            progress: this.loadingProgress(),
            total: this.numberOfTables(),
          };
          return z.l10n.text(z.string.backupImportProgressSecondary, replacements);
        }
        default:
          return '';
      }
    });

    this.error.subscribe(error => {
      if (!error) {
        this.errorHeadline('');
        this.errorSecondary('');
      } else if (error instanceof z.backup.DifferentAccountError) {
        this.errorHeadline(z.l10n.text(z.string.backupImportAccountErrorHeadline));
        this.errorSecondary(z.l10n.text(z.string.backupImportAccountErrorSecondary));
      } else if (error instanceof z.backup.IncompatibleBackupError) {
        this.errorHeadline(z.l10n.text(z.string.backupImportVersionErrorHeadline));
        this.errorSecondary(z.l10n.text(z.string.backupImportVersionErrorSecondary));
      } else {
        this.errorHeadline(z.l10n.text(z.string.backupImportGenericErrorHeadline));
        this.errorSecondary(z.l10n.text(z.string.backupImportGenericErrorSecondary));
      }
    });

    this.backupRepository = repositories.backup;

    amplify.subscribe(z.event.WebApp.BACKUP.IMPORT.START, this.importHistory.bind(this));
  }

  importHistory(file) {
    this.state(HistoryImportViewModel.STATE.PREPARING);
    this.error(null);
    JSZip.loadAsync(file)
      .then(archive => this.backupRepository.importHistory(archive, this.onInit.bind(this), this.onProgress.bind(this)))
      .then(this.onSuccess.bind(this))
      .catch(this.onError.bind(this));
  }

  onInit(numberOfTables) {
    this.state(HistoryImportViewModel.STATE.PREPARING);
    this.numberOfTables(numberOfTables);
    this.numberOfProcessedTables(0);
    this.error(null);
  }

  onProgress() {
    this.state(HistoryImportViewModel.STATE.IMPORTING);
    this.numberOfProcessedTables(this.numberOfProcessedTables() + 1);
  }

  onSuccess() {
    this.error(null);
    this.state(HistoryImportViewModel.STATE.DONE);
    window.setTimeout(this.dismissImport.bind(this), 1000);
  }

  onCancel() {
    this.backupRepository.cancelAction();
  }

  dismissImport() {
    amplify.publish(z.event.WebApp.CONTENT.SWITCH, z.viewModel.ContentViewModel.STATE.PREFERENCES_ACCOUNT);
  }

  onError(error) {
    this.error(error);
  }
};