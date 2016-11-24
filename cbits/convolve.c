#include <assert.h>
#include <stdint.h>
#include <stdlib.h>
#include <math.h>
#include <time.h>

#include "stb_image.h"
#include "stb_image_write.h"

typedef int32_t i32;
typedef uint8_t u8;
typedef uint64_t u64;

void
copyextend(i32 *out, u8 *in, i32 size)
{
        for (int i = 0; i < size; i++) {
                out[i] = (i32)in[i];
        }
}

void
convolvex2(i32 *obuf1, i32 *obuf2,
         i32 *kernel1, i32 *kernel2, i32 klen,
         i32 *ibuf1, i32 *ibuf2, i32 buflen,
         i32 step)
{
        const i32 shift = klen / 2;
        const i32 rem = klen % 2;

        const i32 minbound = shift * step;
        const i32 maxbound = buflen - (shift + rem) * step;

        for (i32 i = minbound; i < maxbound; i++) {
                for (i32 k = -shift; k < shift + rem; k++) {
                        i32 f = i + step * k;
                        obuf1[i] += ibuf1[f] * kernel1[k+shift];
                        obuf2[i] += ibuf2[f] * kernel2[k+shift];
                }
        }
}

const i32 nchans = 3;

void
magnitude(u8 *mag, i32 *xs, i32 *ys, i32 size)
{
        for (int p = 0; p < size / nchans; p++) {
                int i = p*nchans;
                u8 px = sqrt(xs[i] * xs[i] + ys[i] * ys[i]);
                mag[i] = px;
                mag[i+1] = px;
                mag[i+2] = px;
                if (nchans == 4)
                        mag[i+3] = 255;
        }
}

#define DEBUGINT(x) (printf("%s = %d\n", #x, x))

int
main(int ac, char **av)
{
        assert(ac == 3);

        i32 ix, iy, in;
        u8 *image = stbi_load(av[1], &ix, &iy, &in, nchans);
        const i32 size = ix*iy*nchans;

        DEBUGINT(size);

        u64 start = clock_gettime_nsec_np(CLOCK_REALTIME);

        i32 *input = calloc(size, sizeof(i32));
        copyextend(input, image, size);

        i32 *x1 = calloc(size, sizeof(i32));
        i32 *y1 = calloc(size, sizeof(i32));

        i32 sobel1[3] = {1, 2, 1};
        i32 sobel2[3] = {-1, 0, 1};

        convolvex2(x1, y1,
                 sobel2, sobel1, 3,
                 input, input, size,
                 nchans);

        i32 *xs = calloc(size, sizeof(i32));
        i32 *ys = calloc(size, sizeof(i32));

        convolvex2(xs, ys,
                 sobel1, sobel2, 3,
                 x1, y1, size,
                 nchans * ix);

        u8 *mags = calloc(size, sizeof(u8));

        magnitude(mags, xs, ys, size);

        u64 end = clock_gettime_nsec_np(CLOCK_REALTIME);

        stbi_write_png(av[2], ix, iy, nchans, mags, 0);

        printf("sobel: %.3lf ms\n", (end - start) / 1000000.0);

        return 0;
}
