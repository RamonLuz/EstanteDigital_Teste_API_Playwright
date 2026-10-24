export interface BookRequest {
  title: string;
  author: string;
  price: number;
}

export interface BookResponse extends BookRequest {
  id: number;
}

export interface CustomerRequest {
  name: string;
  cpf: string;
  status: string;
  purchases?: BookResponse[];
}

export interface CustomerResponse extends CustomerRequest {
  id: number;
}

export interface EmployeeRequest {
  name: string;
  cpf: string;
  registrationNumber: number;
  position: string;
  status: string;
}

export interface EmployeeResponse extends EmployeeRequest {
  id: number;
}

export interface SaleRequest {
  customerCpf: string;
  employeeRegistrationNumber: number;
  bookTitle: string;
  bookAuthor: string;
  saleDate: string;
}

export interface SaleResponse {
  id: number;
  customer: CustomerResponse;
  employee: EmployeeResponse;
  book: BookResponse;
  saleDate: string;
}

export interface ApiError {
  status: number;
  message: string;
  field: string;
}
