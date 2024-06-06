import * as React from 'react';
import './App.css';
import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import { ScheduleComponent, Day, Week, WorkWeek, Month, Agenda, Timezone, Inject, Resize, DragAndDrop } from '@syncfusion/ej2-react-schedule';
import { applyCategoryColor } from './helper';
import { Browser, extend } from '@syncfusion/ej2-base';
import { DropDownListComponent, DropDownList } from '@syncfusion/ej2-react-dropdowns';
import { tz } from 'moment-timezone';
import { TimePickerComponent } from '@syncfusion/ej2-react-calendars';


if (Browser.isIE) {
    Timezone.prototype.offset = (date, timezone) => {
        return tz.zone(timezone).utcOffset(date.getTime());
    };
}

function App() {
    const scheduleObj = useRef(null);

    const [country, setCountry] = useState('');
    const [events, setEvents] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const fields = {
        startTime: { name: 'StartTime', validation: { required: true } },
        endTime: { name: 'EndTime', validation: { required: true } },
    };
    const timezone = new Timezone();
    const timeZoneOptions = [
        { text: '(UTC-05:00) Eastern Time', value: 'America/New_York' },
        { text: 'Coordinated Universal Time', value: 'UTC' },
        { text: '(UTC+03:00) Moscow+00 - Moscow', value: 'Europe/Moscow' },
        { text: '(UTC+05:30) India Standard Time', value: 'Asia/Kolkata' },
        { text: '(UTC+08:00) Western Time - Perth', value: 'Australia/Perth' }
    ];
    // const fields = { text: 'text', value: 'value' };
    const [schedulerTimezone, setSchedulerTimezone] = useState('UTC');

    // Here remove the local offset from events
    const onCreate = () => {
       
    };
    const onEventRendered = (args) => {
        applyCategoryColor(args, scheduleObj.current?.currentView);
    };
    const onTimeZoneChange = (args) => {
        setSchedulerTimezone(args.value);
        scheduleObj.current?.dataBind();
    };

  const editorHeaderTemplate = (props) => {
      return (<div id="event-header">
      {(props !== undefined) ? ((props.Subject) ? <div>{props.Subject}</div> : <div>Create New Event</div>) : <div></div>}
    </div>);
  };

  const editorTemplate = (props) => {
    return ((props !== undefined) ?
        <table className="custom-event-editor" style={{ width: '100%' }} cellPadding={5}>
    <tbody>
      <tr>
        <td className="e-textlabel">Title</td>
        <td colSpan={4}>
          <input  className="e-field e-input" type="text" name="Title" style={{ width: '100%' }}/>
        </td>
      </tr>
      <tr>
        <td className="e-textlabel">From</td>
        <td colSpan={4}>
          <TimePickerComponent id="StartTime" format='yyyy-MM-ddTHH:mm:ss' data-name="StartTime" value={new Date(props.endTime || props.EndTime)} className="e-field"/>
        </td>
      </tr>
      <tr>
        <td className="e-textlabel">To</td><td colSpan={4}>
          <TimePickerComponent id="EndTime" format='yyyy-MM-ddTHH:mm:ss' data-name="EndTime" value={new Date(props.endTime || props.EndTime)} className="e-field"/>
        </td>
      </tr>
      <tr>
        <td className="e-textlabel">Description</td>
        <td colSpan={4}>
          <textarea id="Description" className="e-field e-input" name="Description" rows={3} cols={50} style={{ width: '100%', height: '60px !important', resize: 'vertical' }}/>
        </td>
      </tr>
      <tr>
        <td className="e-textlabel">Participants</td>
        <td colSpan={4}>
          <input id="Participants" className="e-field e-input" type="text" name="Participants" style={{ width: '100%' }}/>
        </td>
      </tr>
    </tbody>
  </table>
        :
            <div></div>);
};


  const onActionBegin = async (args) => {
    if (
      args.requestType === "eventCreate"
    ) {
      let data = args.data instanceof Array ? args.data[0] : args.data;
      if (!scheduleObj.current.isSlotAvailable(data.StartTime, data.EndTime)) {
        args.cancel = true;
      }
      else{
        console.log(args);
        const startTime = args.data[0].StartTime
        const endTime = args.data[0].EndTime
        const subject = args.data[0].Subject || ''
        const title = args.data[0].Title || ''
        const description = args.data[0].Description || ''
        const participants = args.data[0].Participants || ''

        try {

          const eventData = {
            "title": title ? title : subject,
            "description": description ? description : '',
            "start_time": endTime ? new Date(endTime).toISOString().replace('Z','') : '2024-06-03T00:00:00',
            "end_time": endTime ? new Date(endTime).toISOString().replace('Z','') : '2024-06-03T23:59:59',
            "participants": participants ? participants : ''
          }
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/events`, eventData, {
              headers: {
                  'Content-Type': 'application/json',
              },
          });
          const newEvent = response.data;

          const fetchedEvents = {
              Id: newEvent.id,
              Subject: newEvent.title,
              StartTime: new Date(newEvent.start_time),
              EndTime: new Date(newEvent.end_time),
              IsAllDay: false,
              EventType: 'Event'
          };

          // Update events state with the newly created event
          setEvents([...events, fetchedEvents]);
      } catch (error) {
          console.error('Error creating event:', error);
      }

      }
    }
    if (args.requestType === "eventChange"){

    }
    if (args.requestType === "eventRemove"){
      const id = args.data[0].Id;
      await axios.delete(`${process.env.REACT_APP_API_URL}/events/${id}`);
    }
  };

  // handlePopupOpen();

    // Fetch holiday data
    useEffect(() => {
      const fetchCountry = async () => {
        try {
          const response = await axios.get(`https://ipinfo.io?token=${process.env.REACT_APP_IPINFO_TOKEN}`);
          console.log(response)
          setCountry(response.data.country);
        } catch (error) {
          console.error('Error fetching country data:', error);
        }
      };
  
      fetchCountry();

      const fetchEvents = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:5000/events');
            const fetchedEvents = response.data.map(event => ({
                Id: event.id,
                Subject: event.title,
                StartTime: new Date(event.start_time),
                EndTime: new Date(event.end_time),
                IsAllDay: false,
                EventType: 'Event'
            }));
            setEvents(fetchedEvents);
        } catch (error) {
            console.error('Error fetching events data:', error);
        }
    };

    fetchEvents();

      const fetchHolidays = async () => {
        try {
          const response = await axios.get('https://calendarific.com/api/v2/holidays', {
            params: {
              // api_key: ${process.env.REACT_APP_HOLIDAY_API_KEY},
              country: country !== '' ? country : 'US',
              year: new Date().getFullYear(),
              type: 'national'
            }
          });
          const holidayEvents = response.data.response.holidays.map(holiday => ({
            Id: holiday.id,
            Subject: holiday.name,
            StartTime: new Date(holiday.date.iso),
            EndTime: new Date(holiday.date.iso),
            IsAllDay: true,
            EventType: 'Holiday'
          }));

          console.log(holidayEvents)
          setHolidays(holidayEvents);
        } catch (error) {
          console.error('Error fetching holiday data:', error);
        }
      };

      fetchHolidays();
    }, []);


    return (<div className='schedule-control-section'>
      <div className='col-lg-12 control-section'>
        <div className='control-wrapper'>
          <table id='property' title='Properties' className='property-panel-table' style={{ width: '100%', marginBottom: '18px' }}>
            <tbody>
              <tr style={{ height: '50px' }}>
                <td style={{ width: '5%' }}>
                  <div className='timezone' style={{ fontSize: '14px' }}> Timezone
                  </div>
                </td>
                <td style={{ width: '70%' }}>
                  <div>
                    <DropDownListComponent style={{ padding: '6px' }} value={'UTC'} popupWidth='auto' fields={fields} dataSource={timeZoneOptions} change={onTimeZoneChange} floatLabelType='Always' width='250'/>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <ScheduleComponent width='100%' showQuickInfo={false} ref={scheduleObj} timezone={schedulerTimezone} eventSettings={{ dataSource: [...events,...holidays] }} editorTemplate={editorTemplate} editorHeaderTemplate={editorHeaderTemplate} actionBegin={onActionBegin} created={onCreate} eventRendered={onEventRendered} currentView='Month'>
            <Inject services={[Day, Week, WorkWeek, Month, Agenda, Resize, DragAndDrop]}/>
          </ScheduleComponent>
        </div>
      </div>
    </div>);
};
export default App;
