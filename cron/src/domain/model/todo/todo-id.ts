export class TodoId {
  constructor(public readonly value: string) {
    if (!value) {
      throw new Error("TodoId cannot be empty");
    }
  }

  equals(other: TodoId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}