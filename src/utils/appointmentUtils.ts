import { 
  Appointment, 
  AppointmentType, 
  TOTAL_HOLTER_DEVICES,
  appointmentTypes 
} from '../types';

export function checkDeviceAvailability(
  appointments: Appointment[],
  appointmentType: AppointmentType,
  startDate: Date
): { 
  available: boolean; 
  nextAvailableDate?: Date; 
  inUseCount: number;
  remainingDevices: number;
  restrictionEnd?: Date;
  conflictingAppointments?: Appointment[];
} {
  if (!appointmentType.deviceGroup || !appointmentType.restrictionHours) {
    return { available: true, inUseCount: 0, remainingDevices: 0 };
  }

  // Get all appointments that use the same device group
  const relevantAppointments = appointments.filter(apt => {
    const currentType = appointmentTypes.find(t => t.id === apt.appointmentType);
    return currentType?.deviceGroup === appointmentType.deviceGroup;
  });

  // Find appointments that overlap with the requested time slot
  const conflictingAppointments = relevantAppointments.filter(apt => {
    const currentType = appointmentTypes.find(t => t.id === apt.appointmentType);
    if (!currentType?.restrictionHours) return false;

    const appointmentStart = new Date(apt.start);
    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setHours(appointmentStart.getHours() + currentType.restrictionHours);

    return startDate >= appointmentStart && startDate <= appointmentEnd;
  });

  const inUseCount = conflictingAppointments.length;
  const remainingDevices = TOTAL_HOLTER_DEVICES - inUseCount;
  const available = remainingDevices > 0;

  let restrictionEnd: Date | undefined;
  let nextAvailableDate: Date | undefined;

  if (conflictingAppointments.length > 0) {
    // Sort appointments by end time to find the earliest device return
    const sortedAppointments = [...conflictingAppointments].sort((a, b) => {
      const aType = appointmentTypes.find(t => t.id === a.appointmentType);
      const bType = appointmentTypes.find(t => t.id === b.appointmentType);
      const aEnd = new Date(a.start);
      const bEnd = new Date(b.start);
      aEnd.setHours(aEnd.getHours() + (aType?.restrictionHours || 0));
      bEnd.setHours(bEnd.getHours() + (bType?.restrictionHours || 0));
      return aEnd.getTime() - bEnd.getTime();
    });

    if (!available) {
      const firstAvailableDevice = sortedAppointments[0];
      const firstType = appointmentTypes.find(t => t.id === firstAvailableDevice.appointmentType);
      const availableDate = new Date(firstAvailableDevice.start);
      availableDate.setHours(availableDate.getHours() + (firstType?.restrictionHours || 0));
      nextAvailableDate = availableDate;
    }

    // Set restriction end to when the last active appointment ends
    const lastAppointment = sortedAppointments[sortedAppointments.length - 1];
    const lastType = appointmentTypes.find(t => t.id === lastAppointment.appointmentType);
    restrictionEnd = new Date(lastAppointment.start);
    restrictionEnd.setHours(restrictionEnd.getHours() + (lastType?.restrictionHours || 0));
  }

  return { 
    available, 
    nextAvailableDate, 
    inUseCount,
    remainingDevices,
    restrictionEnd,
    conflictingAppointments
  };
}