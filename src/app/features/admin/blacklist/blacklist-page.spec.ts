import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { buttonWithText, text } from '../../../../testing/dom';
import { aPage } from '../../../../testing/test-data';
import { BlacklistApi } from '../../../core/api/blacklist-api';
import { Notifier } from '../../../core/notifications/notifier';
import { BlacklistPage } from './blacklist-page';

describe('BlacklistPage', () => {
  const entry = { memberId: 'member-1', memberName: 'Ana Smith', addedAt: '2026-03-20T00:00:00Z' };

  function setup() {
    const api = {
      list: vi.fn().mockReturnValue(of(aPage([entry]))),
      refresh: vi.fn().mockReturnValue(of(2)),
      remove: vi.fn().mockReturnValue(of(undefined)),
    };
    const notifier = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: BlacklistApi, useValue: api },
        { provide: Notifier, useValue: notifier },
      ],
    });

    return { api, notifier };
  }

  it('lists the blocked members', async () => {
    setup();
    const fixture = TestBed.createComponent(BlacklistPage);
    await fixture.whenStable();

    expect(text(fixture)).toContain('Ana Smith');
  });

  it('runs the overdue check and reloads the list', async () => {
    const { api, notifier } = setup();
    const fixture = TestBed.createComponent(BlacklistPage);
    await fixture.whenStable();

    buttonWithText(fixture, 'Run overdue check now').click();
    await fixture.whenStable();

    expect(notifier.success).toHaveBeenCalledWith('2 member(s) added to the blacklist.');
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('unblocks a member', async () => {
    const { api, notifier } = setup();
    const fixture = TestBed.createComponent(BlacklistPage);
    await fixture.whenStable();

    buttonWithText(fixture, 'Unblock').click();

    expect(api.remove).toHaveBeenCalledWith('member-1');
    expect(notifier.success).toHaveBeenCalledWith('Ana Smith can borrow books again.');
  });
});
