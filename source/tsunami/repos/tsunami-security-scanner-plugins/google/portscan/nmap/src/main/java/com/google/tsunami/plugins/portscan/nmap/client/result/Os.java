/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.tsunami.plugins.portscan.nmap.client.result;

import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;

/** Os element of nmap XML result. */
@AutoValue
public abstract class Os {
  public abstract ImmutableList<PortUsed> portsUsed();
  public abstract ImmutableList<OsMatch> osMatches();
  public abstract ImmutableList<OsFingerprint> osFingerprints();

  public abstract Builder toBuilder();
  public static Builder builder() {
    return new AutoValue_Os.Builder();
  }

  /** Builder for {@link Os}. */
  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setPortsUsed(Iterable<PortUsed> value);
    abstract ImmutableList.Builder<PortUsed> portsUsedBuilder();
    public Builder addPortUsed(PortUsed value) {
      portsUsedBuilder().add(value);
      return this;
    }

    public abstract Builder setOsMatches(Iterable<OsMatch> value);
    abstract ImmutableList.Builder<OsMatch> osMatchesBuilder();
    public Builder addOsMatch(OsMatch value) {
      osMatchesBuilder().add(value);
      return this;
    }

    public abstract Builder setOsFingerprints(Iterable<OsFingerprint> value);
    abstract ImmutableList.Builder<OsFingerprint> osFingerprintsBuilder();
    public Builder addOsFingerprint(OsFingerprint value) {
      osFingerprintsBuilder().add(value);
      return this;
    }

    public abstract Os build();
  }
}
