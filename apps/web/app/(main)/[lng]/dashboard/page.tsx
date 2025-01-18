import Dashboard from '../../../../components/Dashboard';
import { WithI18nParams } from '../../../../types/common';

export default async function DashboardPage(props: WithI18nParams) {
  const params = await props.params;

  return <Dashboard lng={params.lng} />;
}
