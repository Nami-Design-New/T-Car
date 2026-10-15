# Dialog

The shared dialog is controlled. Keep workflow state in the feature that uses
it; the shell only owns accessibility, focus, layering, and presentation.

```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} onClose={() => setOpen(false)} placement="bottom-sheet">
  <Dialog.Header>
    <Dialog.Title>Choose a pickup location</Dialog.Title>
    <Dialog.Close />
  </Dialog.Header>
  <Dialog.Description>Select one to continue your booking.</Dialog.Description>
  <Dialog.Body>{/* feature content */}</Dialog.Body>
  <Dialog.Footer>
    <button type="button" onClick={() => setOpen(false)}>Cancel</button>
  </Dialog.Footer>
</Dialog>
```

Every instance needs a `Dialog.Title` or the root `label` prop. Use
`initialFocusRef` for the first meaningful control in a form, and set either
`closeOnEscape` or `closeOnBackdrop` to `false` only when the flow is blocking.
