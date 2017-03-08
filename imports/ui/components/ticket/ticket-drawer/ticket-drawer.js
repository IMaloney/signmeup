import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';

import moment from 'moment';

import { notifyTicketByEmail, notifyTicketByText } from '/imports/api/tickets/methods';

import './ticket-drawer.html';

Template.TicketDrawer.onCreated(function onCreated() {
  const self = this;
  self.claimDuration = new ReactiveVar(0);

  self.autorun(() => {
    const ticket = Template.currentData().ticket;

    if (self.claimDurationInterval) Meteor.clearInterval(self.claimDurationInterval);

    if (ticket && ticket.isClaimed()) {
      self.claimDurationInterval = Meteor.setInterval(() => {
        self.claimDuration.set(moment().diff(moment(ticket.claimedAt)));
      }, 1000);
    }
  });
});

Template.TicketDrawer.helpers({
  formattedClaimDuration() {
    const duration = moment.duration(Template.instance().claimDuration.get());
    const seconds = duration.seconds();
    const minutes = duration.minutes();

    function prefixZero(num) {
      return (num < 10) ? `0${num}` : `${num}`;
    }

    return `${prefixZero(minutes)}:${prefixZero(seconds)}`;
  },

  showEmailNotificationButton(ticket) {
    return ticket.notifications && ticket.notifications.email;
  },

  showTextNotificationButton(ticket) {
    const phone = ticket.notifications && ticket.notifications.phone;
    return phone && phone.number && phone.carrier;
  },
});

Template.TicketDrawer.events({
  'click .js-notify-email'(event, templateInstance) {
    notifyTicketByEmail.call({
      ticketId: this.ticket._id,
    }, (err) => {
      const notificationResult = $(templateInstance.find('.js-notification-result'));

      if (err) {
        console.error(err);
        notificationResult.append(
          '<div class="text-danger"><i class="material-icons">error_outline</i> Error sending email, sorry.</div>' // eslint-disable-line
        );
      } else {
        notificationResult.append(
          '<div class="text-success"><i class="material-icons">check</i> Email successfully sent.</div>' // eslint-disable-line
        );
      }
    });
  },

  'click .js-notify-text'(event, templateInstance) {
    notifyTicketByText.call({
      ticketId: this.ticket._id,
    }, (err) => {
      const notificationResult = $(templateInstance.find('.js-notification-result'));

      if (err) {
        console.error(err);
        notificationResult.append(
          '<div class="text-danger"><i class="material-icons">error_outline</i> Error sending text, sorry.</div>' // eslint-disable-line
        );
      } else {
        notificationResult.append(
          '<div class="text-success"><i class="material-icons">check</i> Text successfully sent.</div>' // eslint-disable-line
        );
      }
    });
  },
});
