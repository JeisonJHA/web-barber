import React, { useState, useMemo, useEffect } from 'react';
import {
  format,
  subDays,
  addDays,
  setMilliseconds,
  setSeconds,
  setMinutes,
  setHours,
  isBefore,
  isEqual,
  parseISO,
} from 'date-fns';
import { useSelector } from 'react-redux';
import { utcToZonedTime } from 'date-fns-tz';
import pt from 'date-fns/locale/pt';
import { MdChevronRight, MdChevronLeft, MdBlock } from 'react-icons/md';

import { Container, Time } from './styles';
import api from '~/services/api';

export default function Dashboard() {
  const user_id = useSelector(state => state.user.profile.id);
  const [schedule, setSchedule] = useState([]);
  const [date, setDate] = useState(new Date());

  const dateFormatted = useMemo(
    () => format(date, "d 'de' MMMM", { locale: pt }),
    [date]
  );

  useEffect(() => {
    async function loadSchedule() {
      const resp = await api.get('schedules', {
        params: { date },
      });
      const availableResp = await api.get(`/providers/${user_id}/available`, {
        params: { date: date.getTime() },
      });

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (!availableResp) {
        setSchedule([]);
        return;
      }
      const data = availableResp.data.map(time => {
        const [hour] = time.time.split(':');
        const checkDate = setMilliseconds(
          setSeconds(setMinutes(setHours(date, hour), 0), 0),
          0
        );
        const compareDate = utcToZonedTime(checkDate, timezone);

        return {
          id: time.id,
          time: `${time.time}h`,
          past: isBefore(compareDate, new Date()),
          blocked: time.blocked,
          appointment: resp.data.find(a =>
            isEqual(parseISO(a.date), compareDate)
          ),
        };
      });
      setSchedule(data);
    }
    loadSchedule();
  }, [date, user_id]);

  function handlePrevDay() {
    setDate(subDays(date, 1));
  }

  function handleAddDay() {
    setDate(addDays(date, 1));
  }

  function schedulingLabel(sched) {
    if (sched.appointment) return sched.appointment.user.name;
    if (sched.blocked) return 'Indisponível';
    return 'Em aberto';
  }

  async function handleBlock(id, blocked) {
    await api.put(`/schedule/available/${id}`, {
      provider_id: user_id,
      available: blocked,
    });
    setSchedule(
      schedule.map(hour => {
        if (hour.id === id) {
          hour.blocked = !blocked;
          return hour;
        }
        return hour;
      })
    );
  }

  return (
    <Container>
      <header>
        <button type="button" onClick={handlePrevDay}>
          <MdChevronLeft size={36} color="#FFF" />
        </button>
        <strong>{dateFormatted}</strong>
        <button type="button" onClick={handleAddDay}>
          <MdChevronRight size={36} color="#FFF" />
        </button>
      </header>
      <ul>
        {schedule.map(sched => (
          <Time
            key={sched.id}
            past={sched.past || sched.blocked}
            available={!sched.appointment || sched.blocked}
          >
            <div>
              <strong>{sched.time}</strong>
              <button
                type="button"
                onClick={() => handleBlock(sched.id, sched.blocked)}
              >
                <MdBlock size={24} color="#7159c1" />
              </button>
            </div>
            <span>{schedulingLabel(sched)}</span>
          </Time>
        ))}
      </ul>
    </Container>
  );
}
