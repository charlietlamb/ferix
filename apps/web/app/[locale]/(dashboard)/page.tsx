import { Chart01 } from '@ferix/ui/components/dashboard/charts/chart-01'
import { Chart02 } from '@ferix/ui/components/dashboard/charts/chart-02'
import { Chart03 } from '@ferix/ui/components/dashboard/charts/chart-03'
import { Chart04 } from '@ferix/ui/components/dashboard/charts/chart-04'
import { Chart05 } from '@ferix/ui/components/dashboard/charts/chart-05'
import { Chart06 } from '@ferix/ui/components/dashboard/charts/chart-06'

export default function Page() {
  return (
    <div className="grid auto-rows-min @2xl:grid-cols-2 *:-ms-px *:-mt-px -m-px gap-4 p-2">
      <Chart01 />
      <Chart02 />
      <Chart03 />
      <Chart04 />
      <Chart05 />
      <Chart06 />
    </div>
  )
}
