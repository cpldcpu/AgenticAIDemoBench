"""Print where the boat and tower land on screen at every act, so framing is checked
before a render rather than discovered in one.

The camera law below mirrors src/scene.frag by hand; when the shader's camera changes,
change it here too. Output is in the frame's own uv coordinates, the same ones the
projection in the shader works in, so "off" means off the actual picture.
Run: python3 13_sounding/check_frame.py [t1,t2,...]
"""
import math
from math import atan2, cos, sin
import sys

TWR_AZ, TWR_D, TWR_H = -0.40, 300.0, 45.4
BOAT_AZ, BOAT_D = 0.13, 30.0

TWR = (sin(TWR_AZ) * TWR_D, TWR_H, cos(TWR_AZ) * TWR_D)
BOAT = (sin(BOAT_AZ) * BOAT_D, 0.0, cos(BOAT_AZ) * BOAT_D)
AWAY = atan2(BOAT[0] - TWR[0], BOAT[2] - TWR[2])


def unit(v):
    n = math.sqrt(sum(x * x for x in v))
    return tuple(x / n for x in v)


def sub(a, b):
    return tuple(a[i] - b[i] for i in range(3))


def add(a, b):
    return tuple(a[i] + b[i] for i in range(3))


def mul(a, s):
    return tuple(x * s for x in a)


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def smoothstep(a, b, x):
    if a == b:
        return 0.0 if x < a else 1.0
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def camera(t):
    k = smoothstep(0.0, 126.0, t)
    sw = 0.10 + 0.52 * k + 0.05 * sin(t * 0.19) + 0.03 * sin(t * 0.11 + 1.3)
    r = 40.0 - 16.0 * k
    CP = (BOAT[0] + sin(AWAY + sw) * r, 1.90 + 13.1 * math.pow(k, 1.2), BOAT[2] + cos(AWAY + sw) * r)
    aim = unit(mix(unit(sub(add(BOAT, (0.0, 3.0, 0.0)), CP)), unit(sub(TWR, CP)), 0.5))
    CF = aim
    CR = unit(cross(CF, (0.0, 1.0, 0.0)))
    roll = 0.010 * sin(t * 0.24) + 0.006 * sin(t * 0.43 + 1.7) + 0.035 * smoothstep(108.0, 127.0, t)
    CR = add(mul(CR, cos(roll)), mul(cross(CR, CF), sin(roll)))
    CU = cross(CR, CF)
    return CP, CF, CR, CU


def project(cam, P):
    """To the shader's uv (x in +-1.766, y in +-1), as the ray direction is built there."""
    CP, CF, CR, CU = cam
    q = sub(P, CP)
    dep = sum(q[i] * CF[i] for i in range(3))
    if dep <= 0.001:
        return None
    f = 2.05
    return sum(q[i] * CR[i] for i in range(3)) / dep * f, sum(q[i] * CU[i] for i in range(3)) / dep * f


def main(times):
    print('  t    boat(u,v)      mast(u,v)      lamp(u,v)      verdict')
    bad = 0
    for t in times:
        cam = camera(t)
        pts = [project(cam, P) for P in
               (BOAT, add(BOAT, (0.0, 5.62, 0.0)), TWR)]
        def f(p):
            return '    -    ' if p is None else '%5.2f,%5.2f' % p
        issues = []
        for name, p in (('boat', pts[0]), ('mast', pts[1]), ('lamp', pts[2])):
            if p is None:
                issues.append(name + ' behind')
            elif not (-1.75 < p[0] < 1.75 and -0.98 < p[1] < 0.98):
                issues.append(name + ' off')
        if issues:
            bad += 1
        print('%5.1f %s %s %s  %s' % (t, f(pts[0]), f(pts[1]), f(pts[2]), ','.join(issues) or 'ok'))
    print('\n%d of %d frames have framing problems' % (bad, len(times)))


if __name__ == '__main__':
    ts = [float(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 else \
        [4, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 94, 104, 112, 120, 126]
    main(ts)
