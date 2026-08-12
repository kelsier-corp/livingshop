export class DomainError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entidad: string, id: string) {
    super(`${entidad} no encontrado (id: ${id})`, 404);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "No tenés permisos para realizar esta acción") {
    super(message, 403);
  }
}
