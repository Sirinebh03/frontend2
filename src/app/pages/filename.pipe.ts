import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filename'
})
export class FilenamePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    // Gère les URLs complètes et les chemins relatifs
    const segments = value.split(/[\\/]/);
    return segments.pop() || value;
  }
}