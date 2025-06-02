export function getPriorityText(priority: number): string {
  switch (priority) {
    case 1:
      return "緊急/重要";
    case 2:
      return "不急/重要";
    case 3:
      return "緊急/些末";
    case 4:
    default:
      return "不急/些末";
  }
}
