import { LoginForm } from './login-form'

const ALLOWED_ERRORS: Record<string, string> = {
  'Could not initiate Google sign-in': 'Could not initiate Google sign-in.',
}

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await props.searchParams
  const callbackError = error ? ALLOWED_ERRORS[error] : undefined
  return <LoginForm callbackError={callbackError} />
}
