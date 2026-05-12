/**
 * Employees feature — owner-only screens for managing tenant employees.
 */

export { EmployeeListScreen } from './screens/EmployeeListScreen';
export { EmployeeCreateScreen } from './screens/EmployeeCreateScreen';
export {
  employeesApi,
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useDeactivateEmployeeMutation,
} from './api/employeesApi';
export type { Employee, CreateEmployeeRequest } from './api/employeesApi';
