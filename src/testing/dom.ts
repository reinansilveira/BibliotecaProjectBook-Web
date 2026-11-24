import { ComponentFixture } from '@angular/core/testing';

export function text<T>(fixture: ComponentFixture<T>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

export function fill<T>(fixture: ComponentFixture<T>, selector: string, value: string): void {
  const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector);

  if (!input) {
    throw new Error(`Input "${selector}" not found.`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input'));
}

export function click<T>(fixture: ComponentFixture<T>, selector: string): void {
  const element = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Element "${selector}" not found.`);
  }

  element.click();
}

export function buttonWithText<T>(fixture: ComponentFixture<T>, label: string): HTMLButtonElement {
  const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
  const button = buttons.find((candidate) => candidate.textContent?.includes(label));

  if (!button) {
    throw new Error(`Button "${label}" not found.`);
  }

  return button;
}
