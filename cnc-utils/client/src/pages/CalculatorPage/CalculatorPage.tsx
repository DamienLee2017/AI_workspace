import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Cpu, Gauge, Ruler, Cog } from "lucide-react";

interface CalcResult {
  label: string;
  value: string;
  unit: string;
  note?: string;
}

function ResultDisplay({ results }: { results: CalcResult[] }) {
  return (
    <div className="grid gap-3 mt-4">
      {results.map((r, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{r.label}</span>
            {r.note && <Badge variant="outline" className="text-xs">{r.note}</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono font-semibold text-primary">{r.value}</span>
            <span className="text-sm text-muted-foreground">{r.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, unit }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step="any"
          className="font-mono"
        />
        {unit && (
          <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function LeadScrewCalc() {
  const [pitch, setPitch] = useState("2");
  const [leadAngle, setLeadAngle] = useState("5");
  const [stepsPerRev, setStepsPerRev] = useState("200");

  const results = useMemo<CalcResult[]>(() => {
    const p = parseFloat(pitch) || 0;
    const la = parseFloat(leadAngle) || 0;
    const spr = parseInt(stepsPerRev) || 200;
    const microstep = 16;

    const leadscrewLead = p * Math.cos((la * Math.PI) / 180);
    const stepsPerMm = (spr * microstep) / leadscrewLead;
    const resolution = leadscrewLead / (spr * microstep);

    return [
      { label: "丝杠导程", value: leadscrewLead.toFixed(4), unit: "mm", note: "考虑导程角" },
      { label: "每mm步数", value: stepsPerMm.toFixed(2), unit: "steps/mm" },
      { label: "分辨率", value: (resolution * 1000).toFixed(4), unit: "um", note: "每步" },
      { label: "每转脉冲", value: String(spr * microstep), unit: "pulses/rev" },
    ];
  }, [pitch, leadAngle, stepsPerRev]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <InputField label="螺距" value={pitch} onChange={setPitch} unit="mm" placeholder="2" />
        <InputField label="导程角" value={leadAngle} onChange={setLeadAngle} unit="deg" placeholder="5" />
        <InputField label="电机步数/转" value={stepsPerRev} onChange={setStepsPerRev} unit="steps" placeholder="200" />
      </div>
      <ResultDisplay results={results} />
    </div>
  );
}

function StepperCalc() {
  const [stepsPerRev, setStepsPerRev] = useState("200");
  const [microstep, setMicrostep] = useState("16");
  const [rpm, setRpm] = useState("1000");

  const results = useMemo<CalcResult[]>(() => {
    const spr = parseInt(stepsPerRev) || 200;
    const ms = parseInt(microstep) || 16;
    const r = parseFloat(rpm) || 0;

    const totalSteps = spr * ms;
    const pulseFreq = (totalSteps * r) / 60;
    const stepPeriod = pulseFreq > 0 ? 1000000 / pulseFreq : 0;
    const revTime = r > 0 ? 60 / r : 0;

    return [
      { label: "每转总步数", value: String(totalSteps), unit: "steps/rev", note: spr + "x" + ms },
      { label: "脉冲频率", value: pulseFreq.toFixed(0), unit: "Hz", note: r > 0 ? "正常" : "待机" },
      { label: "脉冲周期", value: stepPeriod.toFixed(1), unit: "us" },
      { label: "一转时间", value: revTime.toFixed(3), unit: "s" },
    ];
  }, [stepsPerRev, microstep, rpm]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <InputField label="电机步数/转" value={stepsPerRev} onChange={setStepsPerRev} unit="steps" placeholder="200" />
        <InputField label="细分倍数" value={microstep} onChange={setMicrostep} unit="umsteps" placeholder="16" />
        <InputField label="目标转速" value={rpm} onChange={setRpm} unit="RPM" placeholder="1000" />
      </div>
      <ResultDisplay results={results} />
      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <p className="text-sm text-warning-foreground">
          提示: 常见步进电机最高脉冲频率约 200-500kHz，驱动器细分越高，最大转速越低。
        </p>
      </div>
    </div>
  );
}

function SpeedAccelCalc() {
  const [maxSpeed, setMaxSpeed] = useState("3000");
  const [acceleration, setAcceleration] = useState("500");
  const [distance, setDistance] = useState("100");

  const results = useMemo<CalcResult[]>(() => {
    const v = parseFloat(maxSpeed) / 60 || 0;
    const a = parseFloat(acceleration) || 0;
    const d = parseFloat(distance) || 0;

    const timeToAccel = a > 0 ? v / a : 0;
    const distAccel = a > 0 ? 0.5 * a * timeToAccel * timeToAccel : 0;
    const distDecel = distAccel;

    const minDistForFullSpeed = distAccel + distDecel;
    const canReachFullSpeed = d >= minDistForFullSpeed;

    const timeAtFullSpeed = canReachFullSpeed && v > 0 ? (d - minDistForFullSpeed) / v : 0;
    const totalTime = canReachFullSpeed 
      ? 2 * timeToAccel + timeAtFullSpeed
      : a > 0 && d > 0 ? Math.sqrt(4 * d / a) : 0;
    
    const jerk = a * 10;

    return [
      { label: "加速时间", value: timeToAccel.toFixed(3), unit: "s" },
      { label: "加速距离", value: distAccel.toFixed(2), unit: "mm" },
      { label: "减速距离", value: distDecel.toFixed(2), unit: "mm" },
      { label: "匀速时间", value: timeAtFullSpeed.toFixed(3), unit: "s" },
      { label: "最短运动时间", value: totalTime.toFixed(3), unit: "s", note: canReachFullSpeed ? "达到目标速度" : "无法达到" },
      { label: "Jerk估计", value: jerk.toFixed(0), unit: "mm/s^3" },
    ];
  }, [maxSpeed, acceleration, distance]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <InputField label="最大速度" value={maxSpeed} onChange={setMaxSpeed} unit="mm/min" placeholder="3000" />
        <InputField label="加速度" value={acceleration} onChange={setAcceleration} unit="mm/s^2" placeholder="500" />
        <InputField label="运动距离" value={distance} onChange={setDistance} unit="mm" placeholder="100" />
      </div>
      <ResultDisplay results={results} />
    </div>
  );
}

function PulseFreqCalc() {
  const [stepsPerMm, setStepsPerMm] = useState("800");
  const [feedRate, setFeedRate] = useState("1500");

  const results = useMemo<CalcResult[]>(() => {
    const spm = parseFloat(stepsPerMm) || 0;
    const fr = parseFloat(feedRate) / 60 || 0;

    const pulseFreq = spm * fr;
    const stepPeriod = pulseFreq > 0 ? 1000000 / pulseFreq : 0;
    const maxRpmAt10kHz = spm > 0 ? 10000 / spm * 60 : 0;
    const maxRpmAt200kHz = spm > 0 ? 200000 / spm * 60 : 0;

    return [
      { label: "脉冲频率", value: (pulseFreq / 1000).toFixed(1), unit: "kHz" },
      { label: "脉冲周期", value: pulseFreq > 0 ? stepPeriod.toFixed(1) : "inf", unit: "us" },
      { label: "10kHz最大进给", value: maxRpmAt10kHz.toFixed(0), unit: "mm/min" },
      { label: "200kHz最大进给", value: maxRpmAt200kHz.toFixed(0), unit: "mm/min" },
    ];
  }, [stepsPerMm, feedRate]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="每mm步数" value={stepsPerMm} onChange={setStepsPerMm} unit="steps/mm" placeholder="800" />
        <InputField label="进给速度" value={feedRate} onChange={setFeedRate} unit="mm/min" placeholder="1500" />
      </div>
      <ResultDisplay results={results} />
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-2xl font-mono font-bold text-primary">
            {parseFloat(feedRate) > 0 ? ((parseFloat(stepsPerMm) * parseFloat(feedRate) / 60) / 1000).toFixed(1) : "0"}
          </div>
          <div className="text-sm text-muted-foreground">kHz</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-2xl font-mono font-bold text-chart-2">
            {parseFloat(feedRate) > 0 ? (1000000 / (parseFloat(stepsPerMm) * parseFloat(feedRate) / 60)).toFixed(1) : "inf"}
          </div>
          <div className="text-sm text-muted-foreground">us/step</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-2xl font-mono font-bold text-chart-3">
            {(parseFloat(feedRate) > 0 ? (200000 / (parseFloat(stepsPerMm) * parseFloat(feedRate) / 60)) : 0).toFixed(0)}
          </div>
          <div className="text-sm text-muted-foreground">200kHz可用</div>
        </div>
      </div>
    </div>
  );
}

function CuttingCalc() {
  const [diameter, setDiameter] = useState("10");
  const [rpm, setRpm] = useState("3000");
  const [feedPerTooth, setFeedPerTooth] = useState("0.05");
  const [teeth, setTeeth] = useState("4");

  const results = useMemo<CalcResult[]>(() => {
    const d = parseFloat(diameter) || 0;
    const r = parseFloat(rpm) || 0;
    const fpt = parseFloat(feedPerTooth) || 0;
    const t = parseInt(teeth) || 1;

    const surfaceSpeed = (Math.PI * d * r) / 1000;
    const feedRateVal = fpt * t * r;
    const chipLoad = fpt;
    const materialRemoval = (surfaceSpeed * 1000 * feedRateVal * 0.5) / 1000000;

    return [
      { label: "线速度", value: surfaceSpeed.toFixed(1), unit: "m/min" },
      { label: "进给速度", value: feedRateVal.toFixed(1), unit: "mm/min" },
      { label: "每齿切屑", value: (chipLoad * 1000).toFixed(1), unit: "um" },
      { label: "材料去除率", value: materialRemoval.toFixed(2), unit: "cm^3/min" },
    ];
  }, [diameter, rpm, feedPerTooth, teeth]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InputField label="刀具直径" value={diameter} onChange={setDiameter} unit="mm" placeholder="10" />
        <InputField label="主轴转速" value={rpm} onChange={setRpm} unit="RPM" placeholder="3000" />
        <InputField label="每齿进给" value={feedPerTooth} onChange={setFeedPerTooth} unit="mm" placeholder="0.05" />
        <InputField label="齿数" value={teeth} onChange={setTeeth} unit="" placeholder="4" />
      </div>
      <ResultDisplay results={results} />
      <Separator className="my-4" />
      <div className="grid gap-4 md:grid-cols-3 text-center">
        <div className="p-3 bg-chart-1/10 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">推荐铝合金线速度</div>
          <div className="font-mono font-semibold">100-200 m/min</div>
        </div>
        <div className="p-3 bg-chart-2/10 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">推荐钢材线速度</div>
          <div className="font-mono font-semibold">30-60 m/min</div>
        </div>
        <div className="p-3 bg-chart-3/10 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">推荐黄铜线速度</div>
          <div className="font-mono font-semibold">60-120 m/min</div>
        </div>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Calculator className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">CNC 参数计算器</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">精密加工参数计算</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            计算丝杠导程、步进电机细分、速度加速度、脉冲频率、切削参数等 CNC 加工关键参数
          </p>
        </div>

        <Tabs defaultValue="leadscrew" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="leadscrew" className="flex items-center gap-2 py-2">
              <Ruler className="w-4 h-4" />
              <span className="hidden sm:inline">丝杠导程</span>
            </TabsTrigger>
            <TabsTrigger value="stepper" className="flex items-center gap-2 py-2">
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">步进电机</span>
            </TabsTrigger>
            <TabsTrigger value="speed" className="flex items-center gap-2 py-2">
              <Gauge className="w-4 h-4" />
              <span className="hidden sm:inline">速度加减速</span>
            </TabsTrigger>
            <TabsTrigger value="pulse" className="flex items-center gap-2 py-2">
              <Cog className="w-4 h-4" />
              <span className="hidden sm:inline">脉冲频率</span>
            </TabsTrigger>
            <TabsTrigger value="cutting" className="flex items-center gap-2 py-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">切削参数</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leadscrew">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  丝杠导程计算器
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  根据丝杠螺距和导程角计算步进电机驱动参数
                </p>
                <LeadScrewCalc />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stepper">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  步进电机细分计算器
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  计算不同细分设置下的脉冲频率和转速关系
                </p>
                <StepperCalc />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="speed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  速度加速度计算器
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  计算加速时间、加速距离和最短运动时间
                </p>
                <SpeedAccelCalc />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pulse">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cog className="w-5 h-5 text-primary" />
                  脉冲频率计算器
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  根据进给速度和步数分辨率计算所需脉冲频率
                </p>
                <PulseFreqCalc />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cutting">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  切削参数计算器
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  计算线速度、进给速度、切屑负荷和材料去除率
                </p>
                <CuttingCalc />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          <p>计算结果仅供参考，实际参数请根据设备手册和经验调整</p>
        </div>
      </div>
    </div>
  );
}
