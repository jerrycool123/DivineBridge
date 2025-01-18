import Login from '../../../../components/Login';
import { WithI18nParams } from '../../../../types/common';

export default async function LoginPage(props: WithI18nParams) {
  const params = await props.params;
  const { lng } = params;

  return <Login lng={lng} />;
}
