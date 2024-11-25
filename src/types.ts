export interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  appointmentType: string;
  patientName: string;
  phoneNumber: string;
  duration: number;
}

export type AppointmentType = {
  id: string;
  name: string;
  defaultDuration: number;
  color: string;
  deviceGroup?: string;
  restrictionHours?: number;
};

export const HOLTER_DEVICE_GROUP = 'holterCardiac';
export const TOTAL_HOLTER_DEVICES = 2;

export const appointmentTypes: AppointmentType[] = [
  { 
    id: 'holter24', 
    name: 'Holter Cardiaco 24h', 
    defaultDuration: 30, 
    color: '#93C5FD',
    deviceGroup: HOLTER_DEVICE_GROUP,
    restrictionHours: 26
  },
  { 
    id: 'holter48', 
    name: 'Holter Cardiaco 48h', 
    defaultDuration: 30, 
    color: '#A5B4FC',
    deviceGroup: HOLTER_DEVICE_GROUP,
    restrictionHours: 50
  },
  { 
    id: 'holter72', 
    name: 'Holter Cardiaco 72h', 
    defaultDuration: 30, 
    color: '#C4B5FD',
    deviceGroup: HOLTER_DEVICE_GROUP,
    restrictionHours: 74
  },
  { 
    id: 'holterPress', 
    name: 'Holter Pressorio', 
    defaultDuration: 30, 
    color: '#DDD6FE'
  },
  { 
    id: 'ecg', 
    name: 'ECG', 
    defaultDuration: 20, 
    color: '#F5D0FE'
  }
];