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
import { utcToZonedTime } from 'date-fns-tz';
import pt from 'date-fns/locale/pt';
import { MdChevronRight, MdChevronLeft } from 'react-icons/md';

import { Container, Time } from './styles';
import api from '~/services/api';

export default function Dashboard() {
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
      const availableResp = await api.get(`/providers/${2}/available`, {
        params: { date: date.getTime() },
      });

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = availableResp.data.map(time => {
        const [hour] = time.time.split(':');
        const checkDate = setMilliseconds(
          setSeconds(setMinutes(setHours(date, hour), 0), 0),
          0
        );
        const compareDate = utcToZonedTime(checkDate, timezone);

        return {
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
  }, [date]);

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
            key={sched.time}
            past={sched.past}
            available={!sched.appointment || sched.blocked}
          >
            <strong>{sched.time}</strong>
            <span>{schedulingLabel(sched)}</span>
          </Time>
        ))}
      </ul>
    </Container>
  );
}
