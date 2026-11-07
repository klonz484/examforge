import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type MouseEventHandler, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "primary", size = "md", loading = false, disabled, className = "", children, ...props }, ref) {
  const classes = ["ui-button", "ui-button--" + variant, "ui-button--" + size, className].filter(Boolean).join(" ");
  return <button {...props} ref={ref} className={classes} disabled={disabled || loading} aria-busy={loading || undefined}>{loading ? <span className="ui-spinner" aria-hidden="true" /> : null}{children}</button>;
});

export interface FieldProps { label: string; hint?: string; error?: string; id?: string; required?: boolean; className?: string; }
function useFieldIds(id?: string) { const generated = useId(); const inputId = id ?? generated; return { inputId, hintId: inputId + "-hint", errorId: inputId + "-error" }; }
function describedBy(hintId: string, errorId: string, hint?: string, error?: string, existing?: string) { return [hint ? hintId : null, error ? errorId : null, existing].filter(Boolean).join(" ") || undefined; }

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & FieldProps;
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ label, hint, error, id, required, className = "", ...props }, ref) {
  const ids = useFieldIds(id);
  return <div className={["ui-field", className].filter(Boolean).join(" ")}><label className="ui-label" htmlFor={ids.inputId}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label><input {...props} ref={ref} id={ids.inputId} className="ui-control" required={required} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy(ids.hintId, ids.errorId, hint, error, props["aria-describedby"])} />{hint ? <p className="ui-hint" id={ids.hintId}>{hint}</p> : null}{error ? <p className="ui-error" id={ids.errorId}>{error}</p> : null}</div>;
});

export type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & FieldProps;
export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField({ label, hint, error, id, required, className = "", ...props }, ref) {
  const ids = useFieldIds(id);
  return <div className={["ui-field", className].filter(Boolean).join(" ")}><label className="ui-label" htmlFor={ids.inputId}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label><textarea {...props} ref={ref} id={ids.inputId} className="ui-control ui-textarea" required={required} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy(ids.hintId, ids.errorId, hint, error, props["aria-describedby"])} />{hint ? <p className="ui-hint" id={ids.hintId}>{hint}</p> : null}{error ? <p className="ui-error" id={ids.errorId}>{error}</p> : null}</div>;
});

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">, FieldProps { children: ReactNode; }
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField({ label, hint, error, id, required, className = "", children, ...props }, ref) {
  const ids = useFieldIds(id);
  return <div className={["ui-field", className].filter(Boolean).join(" ")}><label className="ui-label" htmlFor={ids.inputId}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label><select {...props} ref={ref} id={ids.inputId} className="ui-control" required={required} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy(ids.hintId, ids.errorId, hint, error, props["aria-describedby"])}>{children}</select>{hint ? <p className="ui-hint" id={ids.hintId}>{hint}</p> : null}{error ? <p className="ui-error" id={ids.errorId}>{error}</p> : null}</div>;
});

export interface CheckFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> { label: string; description?: string; className?: string; }
export const CheckboxField = forwardRef<HTMLInputElement, CheckFieldProps>(function CheckboxField({ label, description, className = "", ...props }, ref) {
  const id = useId();
  return <div className={["ui-choice", className].filter(Boolean).join(" ")}><input {...props} ref={ref} id={id} type="checkbox" className="ui-choice__input" /><div><label className="ui-choice__label" htmlFor={id}>{label}</label>{description ? <p className="ui-hint">{description}</p> : null}</div></div>;
});

export interface SwitchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "id"> { label: string; description?: string; className?: string; }
export const SwitchField = forwardRef<HTMLInputElement, SwitchFieldProps>(function SwitchField({ label, description, className = "", ...props }, ref) {
  const id = useId();
  return <div className={["ui-choice", className].filter(Boolean).join(" ")}><input {...props} ref={ref} id={id} type="checkbox" role="switch" className="ui-switch" /><div><label className="ui-choice__label" htmlFor={id}>{label}</label>{description ? <p className="ui-hint">{description}</p> : null}</div></div>;
});

export interface RadioOption { value: string; label: string; description?: string; disabled?: boolean; }
export interface RadioGroupProps { label: string; name: string; value?: string; defaultValue?: string; onChange?: (value: string) => void; options: RadioOption[]; orientation?: "horizontal" | "vertical"; disabled?: boolean; }
export function RadioGroup({ label, name, value, defaultValue, onChange, options, orientation = "vertical", disabled }: RadioGroupProps) {
  return <fieldset className="ui-fieldset" disabled={disabled}><legend className="ui-label">{label}</legend><div className={"ui-radio-group ui-radio-group--" + orientation}>{options.map((option) => <label className="ui-choice" key={option.value}><input className="ui-choice__input" type="radio" name={name} value={option.value} checked={value === undefined ? undefined : value === option.value} defaultChecked={defaultValue === option.value} disabled={option.disabled} onChange={(event) => onChange?.(event.target.value)} /><span><span className="ui-choice__label">{option.label}</span>{option.description ? <span className="ui-hint">{option.description}</span> : null}</span></label>)}</div></fieldset>;
}

export interface DialogProps { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; closeLabel?: string; closeOnBackdrop?: boolean; className?: string; }
export function Dialog({ open, onOpenChange, title, description, children, footer, closeLabel = "Close dialog", closeOnBackdrop = false, className = "" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close(); }, [open]);
  return <dialog ref={ref} className={["ui-dialog", className].filter(Boolean).join(" ")} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onClose={() => { if (open) onOpenChange(false); }} onClick={(event) => { if (closeOnBackdrop && event.target === ref.current) onOpenChange(false); }}><div className="ui-dialog__surface"><header className="ui-dialog__header"><div><h2 id={titleId} className="ui-dialog__title">{title}</h2>{description ? <p id={descriptionId} className="ui-dialog__description">{description}</p> : null}</div><Button type="button" variant="ghost" size="sm" aria-label={closeLabel} onClick={() => ref.current?.close()}>×</Button></header><div className="ui-dialog__content">{children}</div>{footer ? <footer className="ui-dialog__footer">{footer}</footer> : null}</div></dialog>;
}

export interface NavigationItem { href: string; label: ReactNode; current?: boolean; onClick?: MouseEventHandler<HTMLAnchorElement>; }
export interface NavigationProps extends HTMLAttributes<HTMLElement> { items: NavigationItem[]; label?: string; orientation?: "horizontal" | "vertical"; }
export function Navigation({ items, label = "Primary", orientation = "horizontal", className = "", ...props }: NavigationProps) {
  return <nav {...props} aria-label={label} className={["ui-navigation", "ui-navigation--" + orientation, className].filter(Boolean).join(" ")}>{items.map((item) => <a key={item.href} className="ui-navigation__link" href={item.href} aria-current={item.current ? "page" : undefined} onClick={item.onClick}>{item.label}</a>)}</nav>;
}

export interface DataTableColumn<T> { key: string; header: ReactNode; render: (row: T) => ReactNode; align?: "start" | "center" | "end"; }
export interface DataTableProps<T> { caption: string; columns: DataTableColumn<T>[]; rows: T[]; getRowKey: (row: T) => string; emptyMessage?: string; }
export function DataTable<T>({ caption, columns, rows, getRowKey, emptyMessage = "No results found." }: DataTableProps<T>) {
  return <div className="ui-table-wrap"><table className="ui-table"><caption>{caption}</caption><thead><tr>{columns.map((column) => <th key={column.key} scope="col" className={"ui-align--" + (column.align ?? "start")}>{column.header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={getRowKey(row)}>{columns.map((column) => <td key={column.key} className={"ui-align--" + (column.align ?? "start")}>{column.render(row)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="ui-table__empty">{emptyMessage}</td></tr>}</tbody></table></div>;
}

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) { return <section {...props} className={["ui-card", className].filter(Boolean).join(" ")}>{children}</section>; }
export interface StatCardProps { label: string; value: ReactNode; detail?: ReactNode; trend?: ReactNode; }
export function StatCard({ label, value, detail, trend }: StatCardProps) { return <Card className="ui-stat-card"><p className="ui-stat-card__label">{label}</p><p className="ui-stat-card__value">{value}</p>{detail ? <p className="ui-stat-card__detail">{detail}</p> : null}{trend ? <p className="ui-stat-card__trend">{trend}</p> : null}</Card>; }
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) { return <header className="ui-page-header"><div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{actions ? <div className="ui-page-header__actions">{actions}</div> : null}</header>; }
